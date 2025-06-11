// Get DOM elements
const imageUpload = document.getElementById("imageUpload");
const originalImage = document.getElementById("originalImage");
const originalImageContainer = document.getElementById(
  "originalImageContainer"
);
const uploadPrompt = document.getElementById("uploadPrompt");
const pixelatedCanvas = document.getElementById("pixelatedCanvas");
const canvasPrompt = document.getElementById("canvasPrompt");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");
const pixelationRange = document.getElementById("pixelationRange");
const downloadBtn = document.getElementById("downloadBtn");
const messageBox = document.getElementById("messageBox");
const messageText = document.getElementById("messageText");
const closeMessageBtn = document.getElementById("closeMessageBtn");
const selectionCanvas = document.getElementById("selectionCanvas");
const rectangleToolBtn = document.getElementById("rectangleToolBtn");
const brushToolBtn = document.getElementById("brushToolBtn");
const brushSpecificControls = document.getElementById("brushSpecificControls");
const brushSizeRange = document.getElementById("brushSizeRange");
const brushModeToggleBtn = document.getElementById("brushModeToggleBtn");
const undoBtn = document.getElementById("undoBtn");
const pixelatedImageContainer = document.getElementById(
  "pixelatedImageContainer"
);

let uploadedImage = null; // Stores the Image object once uploaded
const ctx = pixelatedCanvas.getContext("2d"); // Context for pixelated image
const selectionCtx = selectionCanvas.getContext("2d", {
  willReadFrequently: true
});

// Constants
const HIDDEN_CLASS = "hidden";
const ACTIVE_TOOL_RECTANGLE = "rectangle";
const ACTIVE_TOOL_BRUSH = "brush";
const BRUSH_MODE_DRAW = "draw";
const BRUSH_MODE_ERASE = "erase";
const MIN_RECT_SELECTION_SIZE = 5;
const MASK_ALPHA_THRESHOLD = 50;

// Selection variables
let isSelecting = false;
let isBrushing = false; // For brush selection
let startX = 0;
let startY = 0;
let selectionRect = null; // { x, y, width, height } in original image coordinates
let activeTool = ACTIVE_TOOL_BRUSH; // 'rectangle' or 'brush', default to brush
let brushMode = BRUSH_MODE_DRAW; // 'draw' or 'erase'
let currentBrushSize = parseInt(brushSizeRange.value);
let lastBrushPoint = { x: 0, y: 0 };

const MAX_HISTORY_SIZE = 20;
let selectionHistory = [];
let currentHistoryIndex = -1;

// Function to show a custom message box instead of alert()
function showMessageBox(message) {
  messageText.textContent = message;
  messageBox.classList.remove(HIDDEN_CLASS);
}

// Event listener for closing the message box
closeMessageBtn.addEventListener("click", () => {
  messageBox.classList.add(HIDDEN_CLASS);
});

function resetImageState() {
  uploadedImage = null;
  originalImage.src = "";
  originalImage.classList.add(HIDDEN_CLASS);
  uploadPrompt.classList.remove(HIDDEN_CLASS);
  originalImageContainer.classList.add("items-center", "justify-center");
  selectionCanvas.style.pointerEvents = "none";

  if (pixelatedCanvas.width > 0 && pixelatedCanvas.height > 0) {
    ctx.clearRect(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
  }
  pixelatedCanvas.width = 1; // Minimal size
  pixelatedCanvas.height = 1;
  pixelatedCanvas.style.width = "";
  pixelatedCanvas.style.height = "";
  pixelatedImageContainer.style.minHeight = ""; // Revert to CSS defined
  canvasPrompt.classList.remove(HIDDEN_CLASS);
  downloadBtn.classList.add(HIDDEN_CLASS);

  clearSelection(); // This also calls saveSelectionState and autoPixelate (which will do nothing if no image)
  selectionHistory = [];
  currentHistoryIndex = -1;
  updateUndoButtonState();
  updateToolUI(); // Reset tool UI as well
}

function _handleImageLoadError(errorMessage) {
  showMessageBox(errorMessage);
  resetImageState();
}

function saveSelectionState() {
  if (
    !selectionCanvas ||
    selectionCanvas.width === 0 ||
    selectionCanvas.height === 0
  )
    return;
  const imageData = selectionCtx.getImageData(
    0,
    0,
    selectionCanvas.width,
    selectionCanvas.height
  );

  // Clear redo stack if we are not at the end of history
  if (currentHistoryIndex < selectionHistory.length - 1) {
    selectionHistory = selectionHistory.slice(0, currentHistoryIndex + 1);
  }

  selectionHistory.push(imageData);
  if (selectionHistory.length > MAX_HISTORY_SIZE) {
    selectionHistory.shift(); // Remove oldest entry
  } else {
    currentHistoryIndex++;
  }
  updateUndoButtonState();
}

function isSelectionCanvasEmpty() {
  if (
    !selectionCanvas ||
    selectionCanvas.width === 0 ||
    selectionCanvas.height === 0
  )
    return true;
  const data = selectionCtx.getImageData(
    0,
    0,
    selectionCanvas.width,
    selectionCanvas.height
  ).data;
  for (let i = 3; i < data.length; i += 4) {
    // Check alpha channel
    if (data[i] > 50) return false; // Found a sufficiently non-transparent pixel
  }
  return true;
}

function updateSelectionButtonsVisibility() {
  const isEmpty = isSelectionCanvasEmpty();
  if (isEmpty && !selectionRect) {
    clearSelectionBtn.classList.add(HIDDEN_CLASS);
  } else {
    clearSelectionBtn.classList.remove(HIDDEN_CLASS);
  }
}

// Function to clear the selection rectangle and hide relevant buttons
function clearSelection() {
  selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
  clearSelectionBtn.classList.add("hidden");
  isBrushing = false;
  selectionRect = null; // Clear rectangle selection object
  saveSelectionState(); // Save the cleared state for undo
  autoPixelate(); // Pixelate whole image after clearing selection
}

// Function to draw the selection rectangle
function drawSelectionRect(x, y, width, height) {
  selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
  selectionCtx.strokeStyle = "rgba(0, 123, 255, 0.9)"; // Blue border
  selectionCtx.lineWidth = 2;
  selectionCtx.setLineDash([5, 5]); // Dashed line
  selectionCtx.strokeRect(x, y, width, height);

  selectionCtx.fillStyle = "rgba(0, 123, 255, 0.05)"; // Lighter blue fill
  selectionCtx.fillRect(x, y, width, height);
}

// Function to draw brush strokes
function drawBrushStroke(x1, y1, x2, y2) {
  selectionCtx.save();
  if (brushMode === BRUSH_MODE_ERASE) {
    selectionCtx.globalCompositeOperation = "destination-out";
  } else {
    selectionCtx.globalCompositeOperation = BRUSH_MODE_DRAW; // "source-over"
  }
  selectionCtx.beginPath();
  selectionCtx.moveTo(x1, y1);
  selectionCtx.lineTo(x2, y2);
  selectionCtx.strokeStyle = "rgba(0, 123, 255, 0.25)"; // More transparent blue for mask
  selectionCtx.lineWidth = currentBrushSize;
  selectionCtx.lineCap = "round";
  selectionCtx.lineJoin = "round";
  selectionCtx.stroke();
  selectionCtx.restore();
}

function updateToolUI() {
  const isBrushTool = activeTool === ACTIVE_TOOL_BRUSH;

  brushToolBtn.classList.toggle("bg-pink-700", isBrushTool);
  rectangleToolBtn.classList.toggle("bg-indigo-700", !isBrushTool);

  brushSpecificControls.classList.toggle(HIDDEN_CLASS, !isBrushTool);
  brushSpecificControls.classList.toggle("flex", isBrushTool);
  // brushModeToggleBtn is inside brushSpecificControls, so its visibility is handled.

  // Specific clearing logic for the *previous* tool state
  // is now handled by clearSelection() called in the tool button event listeners.
  updateSelectionButtonsVisibility();
}

rectangleToolBtn.addEventListener("click", () => {
  activeTool = ACTIVE_TOOL_RECTANGLE;
  clearSelection(); // Clear any existing selection when toggling tool
  updateToolUI();
});

brushToolBtn.addEventListener("click", () => {
  activeTool = ACTIVE_TOOL_BRUSH;
  clearSelection(); // Clear any existing selection when toggling tool
  updateToolUI();
});

brushSizeRange.addEventListener("input", (e) => {
  currentBrushSize = parseInt(e.target.value);
  e.target.nextElementSibling.value = e.target.value;
});

brushModeToggleBtn.addEventListener("click", () => {
  if (brushMode === BRUSH_MODE_DRAW) {
    brushMode = BRUSH_MODE_ERASE;
    brushModeToggleBtn.innerHTML = '<i class="fas fa-eraser"></i>'; // Show eraser icon
    brushModeToggleBtn.title = "Switch to Draw Mode";
  } else {
    brushMode = BRUSH_MODE_DRAW;
    brushModeToggleBtn.innerHTML = '<i class="fas fa-paint-brush"></i>'; // Show brush icon
    brushModeToggleBtn.title = "Switch to Erase Mode";
  }
});

function handlePointerDown(clientX, clientY) {
  if (!uploadedImage) return; // Only allow selection if an image is loaded

  const canvasRect = selectionCanvas.getBoundingClientRect();
  const currentX = clientX - canvasRect.left;
  const currentY = clientY - canvasRect.top;

  if (activeTool === ACTIVE_TOOL_RECTANGLE) {
    isSelecting = true;
    startX = currentX;
    startY = currentY;
  } else if (activeTool === ACTIVE_TOOL_BRUSH) {
    isBrushing = true;
    lastBrushPoint = { x: currentX, y: currentY };
    selectionCtx.save();
    if (brushMode === BRUSH_MODE_ERASE) {
      selectionCtx.globalCompositeOperation = "destination-out";
    } else {
      selectionCtx.globalCompositeOperation = BRUSH_MODE_DRAW; // "source-over"
    }

    selectionCtx.beginPath();
    selectionCtx.arc(currentX, currentY, currentBrushSize / 2, 0, Math.PI * 2);
    selectionCtx.fillStyle = "rgba(0, 123, 255, 0.25)"; // TODO: Use constant
    selectionCtx.fill();
    selectionCtx.restore();
    updateSelectionButtonsVisibility();
  }
}

function handlePointerMove(clientX, clientY) {
  if (!uploadedImage) return;
  const canvasRect = selectionCanvas.getBoundingClientRect();
  const currentX = clientX - canvasRect.left;
  const currentY = clientY - canvasRect.top;

  if (activeTool === ACTIVE_TOOL_RECTANGLE && isSelecting) {
    const width = currentX - startX;
    const height = currentY - startY;
    drawSelectionRect(startX, startY, width, height);
  } else if (activeTool === ACTIVE_TOOL_BRUSH && isBrushing) {
    drawBrushStroke(lastBrushPoint.x, lastBrushPoint.y, currentX, currentY);
    lastBrushPoint = { x: currentX, y: currentY };
  }
}

function handlePointerUp(clientX, clientY) {
  if (!uploadedImage) return;

  if (activeTool === ACTIVE_TOOL_RECTANGLE && isSelecting) {
    isSelecting = false;

    const canvasRect = selectionCanvas.getBoundingClientRect();
    const endX = clientX - canvasRect.left;
    const endY = clientY - canvasRect.top;

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    if (width > MIN_RECT_SELECTION_SIZE && height > MIN_RECT_SELECTION_SIZE) {
      const scaleX = uploadedImage.naturalWidth / originalImage.clientWidth;
      const scaleY = uploadedImage.naturalHeight / originalImage.clientHeight;
      selectionRect = {
        x: Math.floor(x * scaleX),
        y: Math.floor(y * scaleY),
        width: Math.floor(width * scaleX),
        height: Math.floor(height * scaleY)
      };
      clearSelectionBtn.classList.remove(HIDDEN_CLASS);
      autoPixelate();
    } else {
      clearSelection(); // Clear if selection is too small
    }
  } else if (activeTool === ACTIVE_TOOL_BRUSH && isBrushing) {
    isBrushing = false;
    saveSelectionState(); // Save after brush stroke is complete
    autoPixelate();
  }
}

function handlePointerLeave() {
  if (activeTool === ACTIVE_TOOL_RECTANGLE && isSelecting) {
    isSelecting = false;
    clearSelection(); // Clear selection if mouse leaves while selecting
  } else if (activeTool === ACTIVE_TOOL_BRUSH && isBrushing) {
    isBrushing = false;
    saveSelectionState(); // Save if brush leaves canvas mid-stroke
    autoPixelate();
  }
}

// Event listeners for selection on selectionCanvas
selectionCanvas.addEventListener("mousedown", (e) => {
  handlePointerDown(e.clientX, e.clientY);
});

selectionCanvas.addEventListener("mousemove", (e) => {
  handlePointerMove(e.clientX, e.clientY);
});

selectionCanvas.addEventListener("mouseup", (e) => {
  handlePointerUp(e.clientX, e.clientY);
});

selectionCanvas.addEventListener("mouseleave", handlePointerLeave);

// Touch event listeners for selectionCanvas
selectionCanvas.addEventListener("touchstart", (e) => {
  if (!uploadedImage) return;
  e.preventDefault(); // Prevent scrolling/zooming
  const touch = e.touches[0];
  handlePointerDown(touch.clientX, touch.clientY);
});

selectionCanvas.addEventListener("touchmove", (e) => {
  if (!uploadedImage) return;
  e.preventDefault(); // Prevent scrolling/zooming
  const touch = e.touches[0];
  handlePointerMove(touch.clientX, touch.clientY);
});

selectionCanvas.addEventListener("touchend", (e) => {
  if (!uploadedImage) return;
  e.preventDefault();
  const touch = e.changedTouches[0]; // Use changedTouches for touchend
  handlePointerUp(touch.clientX, touch.clientY);
});

// `touchcancel` behaves similarly to `mouseleave` for this application
selectionCanvas.addEventListener("touchcancel", (e) => {
  if (!uploadedImage) return;
  e.preventDefault();
  handlePointerLeave();
});

function setupCanvasesForImage(img) {
  // Size selection canvas to displayed image
  selectionCanvas.width = originalImage.clientWidth;
  selectionCanvas.height = originalImage.clientHeight;

  const canvasOffsetParent = selectionCanvas.offsetParent || document.body;
  const offsetParentRect = canvasOffsetParent.getBoundingClientRect();
  const imgRect = originalImage.getBoundingClientRect();

  selectionCanvas.style.left = `${imgRect.left - offsetParentRect.left}px`;
  selectionCanvas.style.top = `${imgRect.top - offsetParentRect.top}px`;
  selectionCanvas.style.pointerEvents = "auto";

  // Size pixelated canvas buffer to natural image size and its display style
  pixelatedCanvas.width = img.naturalWidth;
  pixelatedCanvas.height = img.naturalHeight;
  pixelatedCanvas.style.width = `${originalImage.clientWidth}px`;
  pixelatedCanvas.style.height = `${originalImage.clientHeight}px`;
  pixelatedImageContainer.style.minHeight = "0"; // Allow canvas to dictate height
}

function initializeImageUI(img, imgSrc) {
  uploadedImage = img;
  originalImage.src = imgSrc;
  originalImage.classList.remove(HIDDEN_CLASS);
  uploadPrompt.classList.add(HIDDEN_CLASS);
  originalImageContainer.classList.remove("items-center", "justify-center");

  setupCanvasesForImage(img);

  selectionHistory = [];
  currentHistoryIndex = -1;
  clearSelection(); // Clears selection, saves state, calls autoPixelate
  updateToolUI(); // Ensure tool UI is correct for a new image
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showMessageBox(
      file ? "Invalid file type. Please upload an image." : "No file selected."
    );
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      initializeImageUI(img, e.target.result);
    };
    img.onerror = () => {
      _handleImageLoadError(
        "Could not load image. Please try a different file."
      );
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    _handleImageLoadError(
      "Error reading file. Please check the file and try again."
    );
  };
  reader.readAsDataURL(file);
}

imageUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleImageFile(file);
  event.target.value = null; // Reset file input
});

// Auto-pixelate function
function autoPixelate() {
  if (!uploadedImage) {
    return;
  }

  // Ensure pixelatedCanvas buffer is sized to natural image dimensions
  if (
    pixelatedCanvas.width !== uploadedImage.naturalWidth ||
    pixelatedCanvas.height !== uploadedImage.naturalHeight
  ) {
    pixelatedCanvas.width = uploadedImage.naturalWidth;
    pixelatedCanvas.height = uploadedImage.naturalHeight;
  }

  // Always draw the original image as the base for the pixelated canvas
  ctx.drawImage(
    uploadedImage,
    0,
    0,
    uploadedImage.naturalWidth,
    uploadedImage.naturalHeight
  );

  let regionToPixelate = null;
  let useBrushMaskForPixelation = false;

  if (activeTool === ACTIVE_TOOL_RECTANGLE && selectionRect) {
    regionToPixelate = selectionRect;
  } else if (activeTool === ACTIVE_TOOL_BRUSH && !isSelectionCanvasEmpty()) {
    useBrushMaskForPixelation = true;
  }

  pixelateImage(regionToPixelate, useBrushMaskForPixelation);
}

// Function to pixelate the image or a portion of it
// Takes an optional 'region' argument { x, y, width, height } in original image coordinates
// Takes an optional 'useBrushMask' boolean
function pixelateImage(region = null, useBrushMask = false) {
  if (!uploadedImage) {
    showMessageBox("Please upload an image first.");
    return;
  }

  canvasPrompt.classList.add(HIDDEN_CLASS);
  downloadBtn.classList.remove(HIDDEN_CLASS);

  const originalWidth = uploadedImage.naturalWidth;
  const originalHeight = uploadedImage.naturalHeight;

  // Draw original image onto a temporary canvas to get pixel data
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d", {
    willReadFrequently: true
  });
  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;
  tempCtx.drawImage(uploadedImage, 0, 0);

  const pixelSize = parseInt(pixelationRange.value);

  // The base image (original) should already be drawn on pixelatedCanvas by autoPixelate or other callers.
  // This function now focuses on applying pixelation to the specified part or whole.

  // For region or brush mask, assume pixelatedCanvas already has the base (e.g., original image)

  if (useBrushMask) {
    const scaleXOriginalToDisplay = originalImage.clientWidth / originalWidth;
    const scaleYOriginalToDisplay = originalImage.clientHeight / originalHeight;
    let selectionMaskData = null;
    try {
      selectionMaskData = selectionCtx.getImageData(
        0,
        0,
        selectionCanvas.width,
        selectionCanvas.height
      ).data;
    } catch (e) {
      console.error("Error getting selection mask data: ", e);
      showMessageBox(
        "Could not process brush selection. Canvas might be tainted if image is from cross-origin source without CORS headers."
      );
      return;
    }

    for (let yOrig = 0; yOrig < originalHeight; yOrig += pixelSize) {
      for (let xOrig = 0; xOrig < originalWidth; xOrig += pixelSize) {
        const blockCenterXOrig = xOrig + pixelSize / 2;
        const blockCenterYOrig = yOrig + pixelSize / 2;

        const scX = Math.floor(blockCenterXOrig * scaleXOriginalToDisplay);
        const scY = Math.floor(blockCenterYOrig * scaleYOriginalToDisplay);

        if (
          scX >= 0 &&
          scX < selectionCanvas.width &&
          scY >= 0 &&
          scY < selectionCanvas.height
        ) {
          const maskPixelIndex = (scY * selectionCanvas.width + scX) * 4;
          if (
            selectionMaskData &&
            selectionMaskData[maskPixelIndex + 3] > MASK_ALPHA_THRESHOLD
          ) {
            // Check alpha of brush stroke
            pixelateBlock(
              tempCtx,
              ctx,
              xOrig,
              yOrig,
              pixelSize,
              originalWidth,
              originalHeight
            );
          }
        }
      }
    }
  } else {
    // Rectangle region or whole image
    const startPixelX = region ? Math.max(0, region.x) : 0;
    const startPixelY = region ? Math.max(0, region.y) : 0;
    const endPixelX = region
      ? Math.min(originalWidth, region.x + region.width)
      : originalWidth;
    const endPixelY = region
      ? Math.min(originalHeight, region.y + region.height)
      : originalHeight;

    for (let y = startPixelY; y < endPixelY; y += pixelSize) {
      for (let x = startPixelX; x < endPixelX; x += pixelSize) {
        pixelateBlock(
          tempCtx,
          ctx,
          x,
          y,
          pixelSize,
          endPixelX,
          endPixelY,
          region
        );
      }
    }
  }
}

function pixelateBlock(
  sourceContext,
  targetContext,
  x,
  y,
  blockSize,
  maxX,
  maxY,
  region = null
) {
  const blockX = x;
  const blockY = y;
  // Adjust block dimensions if it's near the edge of the image or region
  const blockWidth = Math.min(
    blockSize,
    (region ? region.x + region.width : maxX) - blockX
  );
  const blockHeight = Math.min(
    blockSize,
    (region ? region.y + region.height : maxY) - blockY
  );

  if (blockWidth <= 0 || blockHeight <= 0) return;

  const imageData = sourceContext.getImageData(
    blockX,
    blockY,
    blockWidth,
    blockHeight
  );
  const pixels = imageData.data;

  let red = 0;
  let green = 0;
  let blue = 0;
  let alpha = 0;
  let count = 0;

  // Calculate average color for the block
  for (let i = 0; i < pixels.length; i += 4) {
    red += pixels[i];
    green += pixels[i + 1];
    blue += pixels[i + 2];
    alpha += pixels[i + 3];
    count++;
  }

  if (count > 0) {
    red = Math.floor(red / count);
    green = Math.floor(green / count);
    blue = Math.floor(blue / count);
    alpha = Math.floor(alpha / count);
  }

  // Draw a rectangle with the average color onto the visible pixelated canvas
  targetContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
  targetContext.fillRect(blockX, blockY, blockWidth, blockHeight);
}

// Event listener for clear selection button
clearSelectionBtn.addEventListener("click", clearSelection);

// Event listener for slider change
pixelationRange.addEventListener("input", () => {
  autoPixelate();
});

// Event listener for download button
downloadBtn.addEventListener("click", () => {
  if (
    pixelatedCanvas.width === 0 ||
    pixelatedCanvas.height === 0 ||
    !uploadedImage
  ) {
    showMessageBox(
      "No pixelated image to download. Please upload and pixelate an image first."
    );
    return;
  }
  const dataURL = pixelatedCanvas.toDataURL("image/png"); // Get image data as PNG
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "pixelated-image.png"; // Suggested filename
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Ensure canvas and image containers resize responsively
window.addEventListener("resize", () => {
  if (uploadedImage) {
    // Allow originalImage to resize, then get its new dimensions
    // Using a microtask to ensure layout has updated
    requestAnimationFrame(() => {
      if (!uploadedImage) return; // Check again in case image was cleared
      // originalImage dimensions will have updated due to browser layout
      if (originalImage.clientWidth === 0 || originalImage.clientHeight === 0)
        return;

      setupCanvasesForImage(uploadedImage); // Re-setup canvases based on new originalImage size

      // After resizing, the selection and pixelation need to be reapplied
      // or cleared. Clearing is simpler and consistent.
      clearSelection();
      updateToolUI();
      autoPixelate();
    });
  }
});

// Drag and Drop
originalImageContainer.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.stopPropagation();
  originalImageContainer.classList.add("border-blue-500", "bg-blue-50");
});

originalImageContainer.addEventListener("dragleave", (event) => {
  event.preventDefault();
  event.stopPropagation();
  originalImageContainer.classList.remove("border-blue-500", "bg-blue-50");
});

originalImageContainer.addEventListener("drop", (event) => {
  event.preventDefault();
  event.stopPropagation();
  originalImageContainer.classList.remove("border-blue-500", "bg-blue-50");
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    handleImageFile(file);
  } else {
    showMessageBox("Please drop an image file.");
  }
});

function updateUndoButtonState() {
  if (currentHistoryIndex > 0) {
    // Can undo if not at the initial state
    undoBtn.classList.remove(HIDDEN_CLASS);
  } else {
    undoBtn.classList.add(HIDDEN_CLASS);
  }
}

undoBtn.addEventListener("click", () => {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const imageData = selectionHistory[currentHistoryIndex];
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    selectionCtx.putImageData(imageData, 0, 0);

    // After undo, selectionRect might be invalid, clear it.
    // Brush mask is implicitly handled by putImageData.
    selectionRect = null;
    updateSelectionButtonsVisibility(); // Check if canvas is empty now
    autoPixelate(); // Re-pixelate based on the restored selection state
  }
  updateUndoButtonState();
});

// Initial setup for prompts and button visibility
canvasPrompt.classList.remove(HIDDEN_CLASS);
uploadPrompt.classList.remove(HIDDEN_CLASS);
originalImageContainer.classList.add("items-center", "justify-center");
originalImage.classList.add(HIDDEN_CLASS);
downloadBtn.classList.add(HIDDEN_CLASS);
clearSelectionBtn.classList.add(HIDDEN_CLASS); // Hide until selection is made
undoBtn.classList.add(HIDDEN_CLASS);
updateToolUI(); // Set initial tool UI
