document.addEventListener("DOMContentLoaded", () => {
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
  const censorTypeSelect = document.getElementById("censorType");
  const effectLevelRange = document.getElementById("effectLevelRange");
  const effectLevelLabel = document.getElementById("effectLevelLabel");
  const effectLevelOutput = document.getElementById("effectLevelOutput");
  const downloadBtn = document.getElementById("downloadBtn");
  const messageBox = document.getElementById("messageBox");
  const messageText = document.getElementById("messageText");
  const closeMessageBtn = document.getElementById("closeMessageBtn");
  const selectionCanvas = document.getElementById("selectionCanvas");
  const rectangleToolBtn = document.getElementById("rectangleToolBtn");
  const brushToolBtn = document.getElementById("brushToolBtn");
  const brushSpecificControls = document.getElementById(
    "brushSpecificControls"
  );
  const brushSizeRange = document.getElementById("brushSizeRange");
  const brushModeToggleBtn = document.getElementById("brushModeToggleBtn");
  const undoBtn = document.getElementById("undoBtn");
  const pixelatedImageContainer = document.getElementById(
    "pixelatedImageContainer"
  );
  const shareBtn = document.getElementById("shareBtn");
  const controlsContainer = document.getElementById("controlsContainer");
  const detectFacesBtn = document.getElementById("detectFacesBtn"); // New button for face detection

  const rectangleToolInstructions = document.getElementById(
    "rectangleToolInstructions"
  );
  const toastContainer = document.getElementById("toast-container");
  const toastMessageElement = document.getElementById("toast-message");
  let uploadedImage = null; // Stores the Image object once uploaded
  let currentOriginalFilename = "image.png"; // Stores the original filename for download
  const ctx = pixelatedCanvas.getContext("2d"); // Context for pixelated image
  let currentImagePixelData = null; // Cache for the source image's pixel data
  let currentImageForPixelData = null; // Tracks the image associated with currentImagePixelData
  const selectionCtx = selectionCanvas.getContext("2d", {
    willReadFrequently: true
  });
  let modelsLoaded = false; // Flag for face-api.js models

  // Constants
  const HIDDEN_CLASS = "hidden";
  const ACTIVE_TOOL_RECTANGLE = "rectangle";
  const ACTIVE_TOOL_BRUSH = "brush";
  const CENSOR_TYPE_PIXELATE = "pixelate";
  const CENSOR_TYPE_BLUR = "blur";
  const CENSOR_TYPE_PIXELATE_BLUR = "pixelate-blur"; // New censor type
  const BRUSH_MODE_DRAW = "draw";
  const BRUSH_MODE_ERASE = "erase";
  const MIN_RECT_SELECTION_SIZE = 5; // Minimum size for a rectangle selection to be valid
  const BRUSH_DRAW_COLOR = "rgb(0, 123, 255)"; // Opaque color for brush strokes
  const BRUSH_VISUAL_OPACITY = 0.25; // Visual opacity for the selection canvas when brush is active
  const MASK_ALPHA_THRESHOLD = 25; // Lowered to detect more translucent strokes
  const FACEAPI_MODEL_URL = "./lib/models"; // Path to face-api.js models
  const CURSOR_DEFAULT = "default";
  const CURSOR_CROSSHAIR = "crosshair";

  // Selection variables
  let isSelecting = false;
  let isBrushing = false; // For brush selection
  let startX = 0;
  let startY = 0;
  let selectionRects = []; // Stores multiple { x, y, width, height } in original image coordinates
  let currentDrawingRect = null; // Stores the rect currently being drawn, in display coordinates
  let currentCensorType = CENSOR_TYPE_PIXELATE_BLUR; // 'pixelate' or 'blur'
  let activeTool = ACTIVE_TOOL_BRUSH; // 'rectangle' or 'brush', default to brush
  let brushMode = BRUSH_MODE_DRAW; // 'draw' or 'erase'
  let currentBrushSize = parseInt(brushSizeRange.value);
  let lastBrushPoint = { x: 0, y: 0 };

  const MAX_HISTORY_SIZE = 20;
  let selectionHistory = [];
  let currentHistoryIndex = -1;
  let toastTimeoutId = null;

  const originalButtonStates = new Map();
  const controlsToDisable = [
    imageUpload,
    censorTypeSelect,
    effectLevelRange,
    downloadBtn,
    shareBtn,
    rectangleToolBtn,
    brushToolBtn,
    brushSizeRange,
    brushModeToggleBtn,
    clearSelectionBtn,
    undoBtn,
    detectFacesBtn
  ].filter((el) => el);

  function setButtonLoading(
    button,
    isLoading,
    loadingHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...'
  ) {
    if (!button) return;
    if (isLoading) {
      if (!originalButtonStates.has(button)) {
        originalButtonStates.set(button, {
          innerHTML: button.innerHTML,
          originalDisabled: button.disabled
        });
      }
      button.innerHTML = loadingHTML;
      button.disabled = true;
    } else {
      if (originalButtonStates.has(button)) {
        const originalState = originalButtonStates.get(button);
        button.innerHTML = originalState.innerHTML;
        button.disabled = originalState.originalDisabled;
        originalButtonStates.delete(button);
      }
    }
  }

  function setControlsDisabled(isDisabled, except = []) {
    controlsToDisable.forEach((control) => {
      if (control && !except.includes(control)) {
        control.disabled = isDisabled;
      }
    });
    if (controlsContainer) {
      controlsContainer.style.opacity = isDisabled ? "0.7" : "1";
      controlsContainer.style.pointerEvents = isDisabled ? "none" : "auto";
    }
    // Special handling for imageUpload as it's not in controlsContainer
    if (imageUpload && !except.includes(imageUpload)) {
      imageUpload.disabled = isDisabled;
      const label = imageUpload.parentElement;
      if (label && label.tagName === "LABEL") {
        label.style.opacity = isDisabled ? "0.7" : "1";
        label.style.pointerEvents = isDisabled ? "none" : "auto";
      }
    }
  }

  // Utility function for debouncing
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // Function to show a toast notification
  function showToast(message, duration = 3000) {
    if (!toastContainer || !toastMessageElement) {
      return;
    }

    toastMessageElement.textContent = message;
    toastContainer.classList.remove(HIDDEN_CLASS);

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    toastTimeoutId = setTimeout(() => {
      toastContainer.classList.add(HIDDEN_CLASS);
      toastTimeoutId = null;
    }, duration);
  }

  // Function to load face-api.js models
  async function loadFaceApiModels() {
    if (!faceapi) {
      console.error(
        "face-api.js not loaded. Face detection will not be available."
      );
      if (detectFacesBtn) detectFacesBtn.classList.add(HIDDEN_CLASS);
      return;
    }
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_MODEL_URL);
      modelsLoaded = true;
      if (uploadedImage && detectFacesBtn) {
        detectFacesBtn.classList.remove(HIDDEN_CLASS);
      }
      console.log("FaceAPI models loaded successfully.");
    } catch (error) {
      console.error("Error loading FaceAPI models:", error);
      showToast(
        "Face detection models failed to load. Feature unavailable.",
        5000
      );
      if (detectFacesBtn) detectFacesBtn.classList.add(HIDDEN_CLASS);
    }
  }
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
    currentImagePixelData = null;
    currentImageForPixelData = null;
    originalImage.src = "";
    originalImage.classList.add(HIDDEN_CLASS);
    uploadPrompt.classList.remove(HIDDEN_CLASS);
    originalImageContainer.classList.add("items-center", "justify-center");
    selectionCanvas.style.pointerEvents = "none";

    // pixelatedCanvas might not exist if element is not found
    if (
      pixelatedCanvas &&
      pixelatedCanvas.width > 0 &&
      pixelatedCanvas.height > 0
    ) {
      ctx.clearRect(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
    }
    pixelatedCanvas.width = 1; // Minimal size
    pixelatedCanvas.height = 1;
    pixelatedCanvas.style.width = "";
    pixelatedCanvas.style.height = "";
    pixelatedImageContainer.style.minHeight = ""; // Revert to CSS defined
    canvasPrompt.classList.remove(HIDDEN_CLASS);
    if (downloadBtn) downloadBtn.classList.add(HIDDEN_CLASS);
    if (shareBtn) shareBtn.classList.add(HIDDEN_CLASS);

    selectionRects = [];
    clearSelection(); // This also calls saveSelectionState and autoPixelate (which will do nothing if no image)

    selectionHistory = [];
    currentHistoryIndex = -1;
    updateUndoButtonState();
    updateToolUI(); // Reset tool UI as well
    if (detectFacesBtn) detectFacesBtn.classList.add(HIDDEN_CLASS);
  }

  function _handleImageLoadError(errorMessage) {
    showMessageBox(errorMessage);
    resetImageState();
  }

  function saveSelectionState() {
    // Clear redo stack if we are not at the end of history
    if (currentHistoryIndex < selectionHistory.length - 1) {
      selectionHistory = selectionHistory.slice(0, currentHistoryIndex + 1);
    }

    let stateData;
    if (activeTool === ACTIVE_TOOL_BRUSH) {
      if (
        !selectionCanvas ||
        selectionCanvas.width === 0 ||
        selectionCanvas.height === 0
      )
        return;
      stateData = selectionCtx.getImageData(
        0,
        0,
        selectionCanvas.width,
        selectionCanvas.height
      );
    } else if (activeTool === ACTIVE_TOOL_RECTANGLE) {
      stateData = JSON.parse(JSON.stringify(selectionRects)); // Deep copy
    } else {
      return;
    }
    selectionHistory.push({ tool: activeTool, data: stateData });
    if (selectionHistory.length > MAX_HISTORY_SIZE) {
      selectionHistory.shift(); // Remove oldest entry
    } else {
      currentHistoryIndex++;
    }
    updateUndoButtonState();
  }

  function isSelectionCanvasEmpty() {
    if (activeTool === ACTIVE_TOOL_RECTANGLE) {
      return selectionRects.length === 0;
    }
    // For brush tool, check canvas content
    if (
      !selectionCanvas ||
      selectionCanvas.width === 0 ||
      selectionCanvas.height === 0
    ) {
      return true;
    }

    const data = selectionCtx.getImageData(
      0,
      0,
      selectionCanvas.width,
      selectionCanvas.height
    ).data;
    for (let i = 3; i < data.length; i += 4) {
      // Check alpha channel
      if (data[i] > MASK_ALPHA_THRESHOLD) return false; // Found a pixel above the mask threshold
    }
    return true;
  }

  function updateSelectionButtonsVisibility() {
    const hasRectangles =
      activeTool === ACTIVE_TOOL_RECTANGLE && selectionRects.length > 0;
    const hasBrushStrokes =
      activeTool === ACTIVE_TOOL_BRUSH && !isSelectionCanvasEmpty();

    if (hasRectangles || hasBrushStrokes) {
      clearSelectionBtn.classList.remove(HIDDEN_CLASS);
    } else {
      clearSelectionBtn.classList.add(HIDDEN_CLASS);
    }
  }

  // Function to clear the selection rectangle and hide relevant buttons
  function clearSelection() {
    if (
      !uploadedImage &&
      isSelectionCanvasEmpty() &&
      selectionRects.length === 0
    ) {
      updateSelectionButtonsVisibility(); // Ensure button is hidden if no image and no selection
      return;
    }
    const clearBtnCurrentlyVisible =
      !clearSelectionBtn.classList.contains(HIDDEN_CLASS);
    if (clearBtnCurrentlyVisible)
      setButtonLoading(
        clearSelectionBtn,
        true,
        '<i class="fas fa-trash-alt mr-2"></i>Clearing...'
      );
    setControlsDisabled(
      true,
      clearBtnCurrentlyVisible ? [clearSelectionBtn] : []
    );

    setTimeout(() => {
      try {
        selectionCtx.clearRect(
          0,
          0,
          selectionCanvas.width,
          selectionCanvas.height
        );
        isBrushing = false;
        selectionRects = [];
        currentDrawingRect = null;
        saveSelectionState();
        applyEffect();
      } finally {
        if (clearBtnCurrentlyVisible)
          setButtonLoading(clearSelectionBtn, false);
        setControlsDisabled(false);
        updateSelectionButtonsVisibility();
      }
    }, 10);
  }

  function scaleRectToDisplay(originalImgRect) {
    if (
      !uploadedImage ||
      !originalImage ||
      originalImage.clientWidth === 0 ||
      originalImage.clientHeight === 0
    )
      return null;
    const scaleX = originalImage.clientWidth / uploadedImage.naturalWidth;
    const scaleY = originalImage.clientHeight / uploadedImage.naturalHeight;
    return {
      x: originalImgRect.x * scaleX,
      y: originalImgRect.y * scaleY,
      width: originalImgRect.width * scaleX,
      height: originalImgRect.height * scaleY
    };
  }

  function scaleRectToOriginal(displayRect) {
    if (
      !uploadedImage ||
      !originalImage ||
      originalImage.clientWidth === 0 ||
      originalImage.clientHeight === 0
    )
      return null;
    const scaleX = uploadedImage.naturalWidth / originalImage.clientWidth;
    const scaleY = uploadedImage.naturalHeight / originalImage.clientHeight;
    return {
      x: Math.floor(displayRect.x * scaleX),
      y: Math.floor(displayRect.y * scaleY),
      width: Math.floor(displayRect.width * scaleX),
      height: Math.floor(displayRect.height * scaleY)
    };
  }

  function redrawSelectionLayer() {
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

    if (activeTool === ACTIVE_TOOL_RECTANGLE) {
      selectionCtx.strokeStyle = "rgba(0, 123, 255, 0.9)";
      selectionCtx.lineWidth = 2;
      selectionCtx.fillStyle = "rgba(0, 123, 255, 0.05)";

      for (const originalRect of selectionRects) {
        const displayRect = scaleRectToDisplay(originalRect);
        if (displayRect) {
          selectionCtx.setLineDash([5, 5]);
          selectionCtx.strokeRect(
            displayRect.x,
            displayRect.y,
            displayRect.width,
            displayRect.height
          );
          selectionCtx.fillRect(
            displayRect.x,
            displayRect.y,
            displayRect.width,
            displayRect.height
          );
        }
      }

      if (currentDrawingRect) {
        selectionCtx.setLineDash([3, 3]);
        selectionCtx.strokeRect(
          currentDrawingRect.x,
          currentDrawingRect.y,
          currentDrawingRect.width,
          currentDrawingRect.height
        );
        selectionCtx.fillRect(
          currentDrawingRect.x,
          currentDrawingRect.y,
          currentDrawingRect.width,
          currentDrawingRect.height
        );
      }
      selectionCtx.setLineDash([]);
    }
  }
  // Function to draw brush strokes
  function drawBrushStroke(x1, y1, x2, y2) {
    selectionCtx.save();
    if (brushMode === BRUSH_MODE_ERASE) {
      selectionCtx.globalCompositeOperation = "destination-out";
    } else {
      selectionCtx.globalCompositeOperation = "source-over"; // Allow stroke to build up, fixes disappearing strokes
    }
    selectionCtx.beginPath();
    selectionCtx.moveTo(x1, y1);
    selectionCtx.lineTo(x2, y2);
    selectionCtx.strokeStyle = BRUSH_DRAW_COLOR;
    selectionCtx.lineWidth = currentBrushSize;
    selectionCtx.lineCap = "round";
    selectionCtx.lineJoin = "round";
    selectionCtx.stroke();
    selectionCtx.restore();
  }

  function generateBrushCursorSVG(size, mode, baseDrawColor) {
    const diameter = Math.max(4, parseInt(size)); // Target visual diameter
    const svgDimension = diameter; // SVG canvas size
    const center = svgDimension / 2;
    let fillColor, strokeColor, strokeWidth;

    if (mode === BRUSH_MODE_ERASE) {
      fillColor = "rgba(255, 100, 100, 0.3)"; // Light red fill for eraser
      strokeColor = "rgb(220, 53, 69)"; // Darker red stroke for eraser
      strokeWidth = 1.5;
    } else {
      // BRUSH_MODE_DRAW
      const rgbValues = baseDrawColor.match(/\d+/g);
      if (rgbValues && rgbValues.length === 3) {
        fillColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, 0.4)`;
        strokeColor = `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
      } else {
        // Fallback
        fillColor = "rgba(0, 123, 255, 0.4)";
        strokeColor = "rgb(0, 123, 255)";
      }
      strokeWidth = 1;
    }

    // Radius of the circle's path, stroke is applied half-inside/half-outside.
    // r = (diameter / 2) - (strokeWidth / 2) makes the outer edge of the stroke align with diameter/2 from center.
    const circlePathRadius = Math.max(0, (diameter - strokeWidth) / 2);

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgDimension}" height="${svgDimension}" viewBox="0 0 ${svgDimension} ${svgDimension}">
        <circle cx="${center}" cy="${center}" r="${circlePathRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      </svg>
    `;
    // Hotspot is the center of the SVG.
    return `url(data:image/svg+xml;base64,${btoa(svgContent)}) ${Math.floor(
      center
    )} ${Math.floor(center)}, auto`;
  }

  function updateToolUI() {
    const isBrushTool = activeTool === ACTIVE_TOOL_BRUSH;
    const isRectangleTool = activeTool === ACTIVE_TOOL_RECTANGLE;

    brushToolBtn.classList.toggle("bg-pink-700", isBrushTool);
    rectangleToolBtn.classList.toggle("bg-indigo-700", !isBrushTool);
    if (rectangleToolInstructions) {
      rectangleToolInstructions.classList.toggle(
        HIDDEN_CLASS,
        !isRectangleTool
      );
    }

    if (selectionCanvas) {
      if (uploadedImage) {
        if (isBrushTool) {
          selectionCanvas.style.opacity = String(BRUSH_VISUAL_OPACITY);
          selectionCanvas.style.cursor = generateBrushCursorSVG(
            currentBrushSize,
            brushMode,
            BRUSH_DRAW_COLOR
          );
        } else if (isRectangleTool) {
          selectionCanvas.style.opacity = "1";
          selectionCanvas.style.cursor = CURSOR_CROSSHAIR;
        } else {
          selectionCanvas.style.opacity = "1";
          selectionCanvas.style.cursor = CURSOR_DEFAULT;
        }
      } else {
        // No image uploaded
        selectionCanvas.style.opacity = "1";
        selectionCanvas.style.cursor = CURSOR_DEFAULT;
      }
    }
    brushSpecificControls.classList.toggle(HIDDEN_CLASS, !isBrushTool);
    brushSpecificControls.classList.toggle("flex", isBrushTool);
    // brushModeToggleBtn is inside brushSpecificControls, so its visibility is handled.
    redrawSelectionLayer();
    updateSelectionButtonsVisibility();
  }

  rectangleToolBtn.addEventListener("click", () => {
    activeTool = ACTIVE_TOOL_RECTANGLE;
    isBrushing = false; // Ensure brush state is reset
    currentDrawingRect = null;
    clearSelection(); // Clear any existing selection when toggling tool
    updateToolUI();
  });

  brushToolBtn.addEventListener("click", () => {
    activeTool = ACTIVE_TOOL_BRUSH;
    clearSelection(); // Clear any existing selection when toggling tool
    selectionRects = []; // Ensure rects are cleared
    updateToolUI();
  });

  brushSizeRange.addEventListener("input", (e) => {
    currentBrushSize = parseInt(e.target.value);
    e.target.nextElementSibling.value = e.target.value;
    if (activeTool === ACTIVE_TOOL_BRUSH && uploadedImage) {
      updateToolUI(); // Update cursor
    }
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
    if (activeTool === ACTIVE_TOOL_BRUSH && uploadedImage) {
      updateToolUI(); // Update cursor
    }
  });

  function handlePointerDown(clientX, clientY) {
    if (!uploadedImage) return; // Only allow selection if an image is loaded

    const canvasRect = selectionCanvas.getBoundingClientRect();
    const currentX = clientX - canvasRect.left;
    const currentY = clientY - canvasRect.top;

    if (activeTool === ACTIVE_TOOL_RECTANGLE) {
      const clickPointInDisplay = { x: currentX, y: currentY };
      let deleted = false;
      for (let i = selectionRects.length - 1; i >= 0; i--) {
        const originalRect = selectionRects[i];
        const displayRect = scaleRectToDisplay(originalRect);
        if (
          displayRect &&
          clickPointInDisplay.x >= displayRect.x &&
          clickPointInDisplay.x <= displayRect.x + displayRect.width &&
          clickPointInDisplay.y >= displayRect.y &&
          clickPointInDisplay.y <= displayRect.y + displayRect.height
        ) {
          selectionRects.splice(i, 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        currentDrawingRect = null;
        isSelecting = false;
        redrawSelectionLayer();
        saveSelectionState();
        applyEffect();
        updateSelectionButtonsVisibility();
        return;
      }

      isSelecting = true;
      startX = currentX;
      startY = currentY;
      currentDrawingRect = null;
    } else if (activeTool === ACTIVE_TOOL_BRUSH) {
      isBrushing = true;
      lastBrushPoint = { x: currentX, y: currentY };
      selectionCtx.save();
      if (brushMode === BRUSH_MODE_ERASE) {
        selectionCtx.globalCompositeOperation = "destination-out";
      } else {
        selectionCtx.globalCompositeOperation = "source-over"; // Allow stroke to build up, fixes disappearing strokes
      }

      selectionCtx.beginPath();
      selectionCtx.arc(
        currentX,
        currentY,
        currentBrushSize / 2,
        0,
        Math.PI * 2
      );
      selectionCtx.fillStyle = BRUSH_DRAW_COLOR;
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
      const rectEndX = currentX;
      const rectEndY = currentY;
      currentDrawingRect = {
        x: Math.min(startX, rectEndX),
        y: Math.min(startY, rectEndY),
        width: Math.abs(rectEndX - startX),
        height: Math.abs(rectEndY - startY)
      };
      redrawSelectionLayer();
    } else if (activeTool === ACTIVE_TOOL_BRUSH && isBrushing) {
      drawBrushStroke(lastBrushPoint.x, lastBrushPoint.y, currentX, currentY);
      lastBrushPoint = { x: currentX, y: currentY };
    }
  }

  function handlePointerUp(clientX, clientY) {
    if (!uploadedImage) return;

    if (activeTool === ACTIVE_TOOL_RECTANGLE && isSelecting) {
      isSelecting = false;
      // currentDrawingRect is already set by the last pointerMove
      if (
        currentDrawingRect &&
        currentDrawingRect.width > MIN_RECT_SELECTION_SIZE &&
        currentDrawingRect.height > MIN_RECT_SELECTION_SIZE
      ) {
        const originalCoordsRect = scaleRectToOriginal(currentDrawingRect);
        if (originalCoordsRect) {
          selectionRects.push(originalCoordsRect);
        }
      }
      currentDrawingRect = null;
      redrawSelectionLayer();
      saveSelectionState();
      applyEffect();
      updateSelectionButtonsVisibility();
    } else if (activeTool === ACTIVE_TOOL_BRUSH && isBrushing) {
      isBrushing = false;
      // A final dot if it was a tap
      if (
        lastBrushPoint.x ===
          clientX - selectionCanvas.getBoundingClientRect().left &&
        lastBrushPoint.y ===
          clientY - selectionCanvas.getBoundingClientRect().top
      ) {
        // This check might be too simple, consider if a tiny drag occurred
        // For simplicity, we assume drawBrushStroke handles single points if x1,y1 == x2,y2
      }
      saveSelectionState();
      applyEffect();
    }
  }

  function handlePointerLeave() {
    if (activeTool === ACTIVE_TOOL_RECTANGLE && isSelecting) {
      isSelecting = false;
      currentDrawingRect = null;
      redrawSelectionLayer();
      // Do not clear all selectionRects, just the one being drawn
    } else if (activeTool === ACTIVE_TOOL_BRUSH && isBrushing) {
      isBrushing = false;
      saveSelectionState();
      applyEffect();
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
    // For touchend, clientX/clientY might not be on the element.
    // We rely on the state from the last touchmove or touchstart.
    // If it's a tap (no move), handlePointerUp will use the start coordinates.
    // If it's a drag, currentDrawingRect will be set.
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
    currentImagePixelData = null; // Invalidate cache for new image
    currentImageForPixelData = null;
    originalImage.classList.remove(HIDDEN_CLASS);
    uploadPrompt.classList.add(HIDDEN_CLASS);
    originalImageContainer.classList.remove("items-center", "justify-center");

    setupCanvasesForImage(img);

    selectionHistory = [];
    currentHistoryIndex = -1;
    selectionRects = []; // Reset rectangles for new image
    currentDrawingRect = null;
    clearSelection(); // Clears selection, saves state, calls applyEffect
    if (modelsLoaded && detectFacesBtn) {
      detectFacesBtn.classList.remove(HIDDEN_CLASS);
    } else if (detectFacesBtn) {
      detectFacesBtn.classList.add(HIDDEN_CLASS);
    }

    updateToolUI(); // Ensure tool UI is correct for a new image
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      imageUpload.value = null; // Reset file input if validation fails early
      showMessageBox(
        file
          ? "Invalid file type. Please upload an image."
          : "No file selected."
      );
      return;
    }

    setControlsDisabled(true);

    const reader = new FileReader();
    currentOriginalFilename = file.name; // Store original filename
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        initializeImageUI(img, e.target.result);
      };
      img.onerror = () => {
        _handleImageLoadError(
          "Could not load image. Please try a different file."
        );
        setControlsDisabled(false);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      _handleImageLoadError(
        "Error reading file. Please check the file and try again."
      );
      setControlsDisabled(false);
    };
    reader.readAsDataURL(file);
    // setControlsDisabled(false) will be called in img.onload or img.onerror / reader.onerror
  }

  imageUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    handleImageFile(file);
    event.target.value = null; // Reset file input
  });

  // Apply current effect (pixelate or blur)
  function applyEffect() {
    if (!uploadedImage) {
      return;
    } else {
      setControlsDisabled(false); // Ensure controls are enabled after image load finishes UI init
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

    let regionsForEffect = null;
    let useBrushMaskForPixelation = false;

    if (activeTool === ACTIVE_TOOL_RECTANGLE && selectionRects.length > 0) {
      regionsForEffect = [...selectionRects];
    } else if (activeTool === ACTIVE_TOOL_BRUSH && !isSelectionCanvasEmpty()) {
      useBrushMaskForPixelation = true;
    }

    // If no selection and not brush, do not apply effect (or apply to whole image if desired)
    if (!regionsForEffect && !useBrushMaskForPixelation) {
      // Optionally, clear canvas prompt and show download/share if an image is loaded but no effect applied
      if (uploadedImage) {
        if (canvasPrompt) canvasPrompt.classList.add(HIDDEN_CLASS);
        downloadBtn.classList.remove(HIDDEN_CLASS);
        if (navigator.share && shareBtn) {
          shareBtn.classList.remove(HIDDEN_CLASS);
        }
      }
      return; // No specific region or brush mask to apply effect to
    }

    applyCensorshipEffect(regionsForEffect, useBrushMaskForPixelation);
  }

  function applyCensorshipEffect(regionsParam = null, useBrushMask = false) {
    if (!uploadedImage) {
      showMessageBox("Please upload an image first.");
      return;
    }

    if (canvasPrompt) canvasPrompt.classList.add(HIDDEN_CLASS);
    downloadBtn.classList.remove(HIDDEN_CLASS);
    if (navigator.share && shareBtn) {
      shareBtn.classList.remove(HIDDEN_CLASS);
    }

    const originalWidth = uploadedImage.naturalWidth;
    const originalHeight = uploadedImage.naturalHeight;

    let sourcePixelArray;

    if (currentImageForPixelData === uploadedImage && currentImagePixelData) {
      sourcePixelArray = currentImagePixelData.data;
    } else {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      tempCtx.drawImage(uploadedImage, 0, 0, originalWidth, originalHeight);
      currentImagePixelData = tempCtx.getImageData(
        0,
        0,
        originalWidth,
        originalHeight
      );
      currentImageForPixelData = uploadedImage;
      sourcePixelArray = currentImagePixelData.data;
    }

    // Draw the original image as the base for the censored canvas
    // This is already done in applyEffect before calling this function.
    // ctx.drawImage(uploadedImage, 0, 0, originalWidth, originalHeight);

    const effectValue = effectLevelRange
      ? parseInt(effectLevelRange.value)
      : 10;

    // Normalize regionsParam for rectangle mode
    const regions =
      activeTool === ACTIVE_TOOL_RECTANGLE &&
      regionsParam &&
      Array.isArray(regionsParam)
        ? regionsParam
        : null;

    if (currentCensorType === CENSOR_TYPE_PIXELATE) {
      const pixelBlockSize = effectValue;
      if (useBrushMask) {
        // ... (existing brush mask logic for pixelation)
        const tempPixelCanvas = document.createElement("canvas");
        tempPixelCanvas.width = originalWidth;
        tempPixelCanvas.height = originalHeight;
        const tempPixelCtx = tempPixelCanvas.getContext("2d");

        for (let y = 0; y < originalHeight; y += pixelBlockSize) {
          for (let x = 0; x < originalWidth; x += pixelBlockSize) {
            const blockW = Math.min(pixelBlockSize, originalWidth - x);
            const blockH = Math.min(pixelBlockSize, originalHeight - y);
            if (blockW <= 0 || blockH <= 0) continue;
            applyPixelateBlock(
              tempPixelCtx,
              sourcePixelArray,
              originalWidth,
              x,
              y,
              blockW,
              blockH
            );
          }
        }
        // ... (rest of brush mask compositing logic)
        const pixelatedImageData = tempPixelCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );

        const scaledSelectionMaskCanvas = document.createElement("canvas");
        scaledSelectionMaskCanvas.width = originalWidth;
        scaledSelectionMaskCanvas.height = originalHeight;
        const scaledSelectionMaskCtx = scaledSelectionMaskCanvas.getContext(
          "2d",
          { willReadFrequently: true }
        );
        scaledSelectionMaskCtx.drawImage(
          selectionCanvas,
          0,
          0,
          selectionCanvas.width,
          selectionCanvas.height,
          0,
          0,
          originalWidth,
          originalHeight
        );
        const selectionMaskImageData = scaledSelectionMaskCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );

        const targetImageData = ctx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );

        for (let i = 0; i < selectionMaskImageData.data.length; i += 4) {
          if (selectionMaskImageData.data[i + 3] > MASK_ALPHA_THRESHOLD) {
            targetImageData.data[i] = pixelatedImageData.data[i];
            targetImageData.data[i + 1] = pixelatedImageData.data[i + 1];
            targetImageData.data[i + 2] = pixelatedImageData.data[i + 2];
            targetImageData.data[i + 3] = pixelatedImageData.data[i + 3];
          }
        }
        ctx.putImageData(targetImageData, 0, 0);
      } else if (regions && regions.length > 0) {
        // Rectangle regions for pixelation
        for (const region of regions) {
          const startPixelX = Math.max(0, region.x);
          const startPixelY = Math.max(0, region.y);
          const endPixelX = Math.min(originalWidth, region.x + region.width);
          const endPixelY = Math.min(originalHeight, region.y + region.height);

          for (let y = startPixelY; y < endPixelY; y += pixelBlockSize) {
            for (let x = startPixelX; x < endPixelX; x += pixelBlockSize) {
              const blockW = Math.min(pixelBlockSize, endPixelX - x);
              const blockH = Math.min(pixelBlockSize, endPixelY - y);
              if (blockW <= 0 || blockH <= 0) continue;
              applyPixelateBlock(
                ctx,
                sourcePixelArray,
                originalWidth,
                x,
                y,
                blockW,
                blockH
              );
            }
          }
        }
      }
    } else if (currentCensorType === CENSOR_TYPE_BLUR) {
      const blurRadius = Math.max(1, Math.round(effectValue * 0.5));
      if (useBrushMask) {
        // ... (existing brush mask logic for blur)
        const tempBlurCanvas = document.createElement("canvas");
        tempBlurCanvas.width = originalWidth;
        tempBlurCanvas.height = originalHeight;
        const tempBlurCtx = tempBlurCanvas.getContext("2d", {
          willReadFrequently: true
        });

        tempBlurCtx.drawImage(
          uploadedImage,
          0,
          0,
          originalWidth,
          originalHeight
        );
        tempBlurCtx.filter = `blur(${blurRadius}px)`;
        tempBlurCtx.drawImage(tempBlurCanvas, 0, 0);
        tempBlurCtx.filter = "none";
        const blurredImageData = tempBlurCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );

        const scaledSelectionMaskCanvas = document.createElement("canvas");
        scaledSelectionMaskCanvas.width = originalWidth;
        scaledSelectionMaskCanvas.height = originalHeight;
        const scaledSelectionMaskCtx = scaledSelectionMaskCanvas.getContext(
          "2d",
          { willReadFrequently: true }
        );
        scaledSelectionMaskCtx.drawImage(
          selectionCanvas,
          0,
          0,
          selectionCanvas.width,
          selectionCanvas.height,
          0,
          0,
          originalWidth,
          originalHeight
        );
        const selectionMaskImageData = scaledSelectionMaskCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );

        const targetImageData = ctx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );

        for (let i = 0; i < selectionMaskImageData.data.length; i += 4) {
          if (selectionMaskImageData.data[i + 3] > MASK_ALPHA_THRESHOLD) {
            targetImageData.data[i] = blurredImageData.data[i];
            targetImageData.data[i + 1] = blurredImageData.data[i + 1];
            targetImageData.data[i + 2] = blurredImageData.data[i + 2];
            targetImageData.data[i + 3] = blurredImageData.data[i + 3];
          }
        }
        ctx.putImageData(targetImageData, 0, 0);
      } else if (regions && regions.length > 0) {
        // Rectangle selection for blur
        for (const region of regions) {
          const padding = Math.ceil(blurRadius * 2.5);

          const tempSourcePaddedCanvas = document.createElement("canvas");
          tempSourcePaddedCanvas.width = region.width + 2 * padding;
          tempSourcePaddedCanvas.height = region.height + 2 * padding;
          const tempSourcePaddedCtx = tempSourcePaddedCanvas.getContext("2d");

          tempSourcePaddedCtx.drawImage(
            uploadedImage,
            region.x,
            region.y,
            region.width,
            region.height,
            padding,
            padding,
            region.width,
            region.height
          );

          const tempBlurredResultCanvas = document.createElement("canvas");
          tempBlurredResultCanvas.width = tempSourcePaddedCanvas.width;
          tempBlurredResultCanvas.height = tempSourcePaddedCanvas.height;
          const tempBlurredResultCtx = tempBlurredResultCanvas.getContext("2d");

          tempBlurredResultCtx.filter = `blur(${blurRadius * 0.75}px)`;
          tempBlurredResultCtx.drawImage(tempSourcePaddedCanvas, 0, 0);
          tempBlurredResultCtx.filter = "none";

          ctx.drawImage(
            tempBlurredResultCanvas,
            padding,
            padding,
            region.width,
            region.height,
            region.x,
            region.y,
            region.width,
            region.height
          );
        }
      }
    } else if (currentCensorType === CENSOR_TYPE_PIXELATE_BLUR) {
      const pixelBlockSize = Math.max(1, Math.round(effectValue * 0.7));
      const blurRadius = Math.max(1, Math.round(pixelBlockSize * 0.6));

      if (useBrushMask) {
        // ... (existing brush mask logic for pixelate-blur)
        const tempFullPixelatedCanvas = document.createElement("canvas");
        tempFullPixelatedCanvas.width = originalWidth;
        tempFullPixelatedCanvas.height = originalHeight;
        const tempFullPixelatedCtx = tempFullPixelatedCanvas.getContext("2d");

        for (let y = 0; y < originalHeight; y += pixelBlockSize) {
          for (let x = 0; x < originalWidth; x += pixelBlockSize) {
            const blockW = Math.min(pixelBlockSize, originalWidth - x);
            const blockH = Math.min(pixelBlockSize, originalHeight - y);
            if (blockW <= 0 || blockH <= 0) continue;
            applyPixelateBlock(
              tempFullPixelatedCtx,
              sourcePixelArray,
              originalWidth,
              x,
              y,
              blockW,
              blockH
            );
          }
        }
        // ... (rest of brush mask compositing for pixelation part)
        const fullPixelatedImageData = tempFullPixelatedCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );
        // ... (mask creation)
        const scaledSelectionMaskCanvas = document.createElement("canvas");
        scaledSelectionMaskCanvas.width = originalWidth;
        scaledSelectionMaskCanvas.height = originalHeight;
        const scaledSelectionMaskCtx = scaledSelectionMaskCanvas.getContext(
          "2d",
          { willReadFrequently: true }
        );
        scaledSelectionMaskCtx.drawImage(
          selectionCanvas,
          0,
          0,
          selectionCanvas.width,
          selectionCanvas.height,
          0,
          0,
          originalWidth,
          originalHeight
        );
        const selectionMaskImageData = scaledSelectionMaskCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );
        const targetPixelationImageData = ctx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );
        for (let i = 0; i < selectionMaskImageData.data.length; i += 4) {
          if (selectionMaskImageData.data[i + 3] > MASK_ALPHA_THRESHOLD) {
            targetPixelationImageData.data[i] = fullPixelatedImageData.data[i];
            targetPixelationImageData.data[i + 1] =
              fullPixelatedImageData.data[i + 1];
            targetPixelationImageData.data[i + 2] =
              fullPixelatedImageData.data[i + 2];
            targetPixelationImageData.data[i + 3] =
              fullPixelatedImageData.data[i + 3];
          }
        }
        ctx.putImageData(targetPixelationImageData, 0, 0);

        // Blur pass for brush mask
        const tempCombinedEffectCanvas = document.createElement("canvas");
        tempCombinedEffectCanvas.width = originalWidth;
        tempCombinedEffectCanvas.height = originalHeight;
        const tempCombinedEffectCtx = tempCombinedEffectCanvas.getContext("2d");
        tempCombinedEffectCtx.drawImage(ctx.canvas, 0, 0);
        tempCombinedEffectCtx.filter = `blur(${blurRadius}px)`;
        tempCombinedEffectCtx.drawImage(tempCombinedEffectCanvas, 0, 0);
        tempCombinedEffectCtx.filter = "none";

        const blurredAndPixelatedData = tempCombinedEffectCtx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );
        // Re-use selectionMaskImageData
        const targetImageData = ctx.getImageData(
          0,
          0,
          originalWidth,
          originalHeight
        );
        for (let i = 0; i < selectionMaskImageData.data.length; i += 4) {
          if (selectionMaskImageData.data[i + 3] > MASK_ALPHA_THRESHOLD) {
            targetImageData.data[i] = blurredAndPixelatedData.data[i];
            targetImageData.data[i + 1] = blurredAndPixelatedData.data[i + 1];
            targetImageData.data[i + 2] = blurredAndPixelatedData.data[i + 2];
            targetImageData.data[i + 3] = blurredAndPixelatedData.data[i + 3];
          }
        }
        ctx.putImageData(targetImageData, 0, 0);
      } else if (regions && regions.length > 0) {
        // --- 1. Apply Pixelation for all regions ---
        for (const region of regions) {
          const startPixelX = Math.max(0, region.x);
          const startPixelY = Math.max(0, region.y);
          const endPixelX = Math.min(originalWidth, region.x + region.width);
          const endPixelY = Math.min(originalHeight, region.y + region.height);

          for (let y = startPixelY; y < endPixelY; y += pixelBlockSize) {
            for (let x = startPixelX; x < endPixelX; x += pixelBlockSize) {
              const blockW = Math.min(pixelBlockSize, endPixelX - x);
              const blockH = Math.min(pixelBlockSize, endPixelY - y);
              if (blockW <= 0 || blockH <= 0) continue;
              applyPixelateBlock(
                ctx,
                sourcePixelArray,
                originalWidth,
                x,
                y,
                blockW,
                blockH
              );
            }
          }
        }

        // --- 2. Apply Blur on top of the pixelated areas in ctx ---
        const tempCombinedEffectCanvas = document.createElement("canvas");
        tempCombinedEffectCanvas.width = originalWidth;
        tempCombinedEffectCanvas.height = originalHeight;
        const tempCombinedEffectCtx = tempCombinedEffectCanvas.getContext("2d");

        tempCombinedEffectCtx.drawImage(ctx.canvas, 0, 0);
        tempCombinedEffectCtx.filter = `blur(${blurRadius}px)`;
        tempCombinedEffectCtx.drawImage(tempCombinedEffectCanvas, 0, 0);
        tempCombinedEffectCtx.filter = "none";

        for (const region of regions) {
          ctx.drawImage(
            tempCombinedEffectCanvas,
            region.x,
            region.y,
            region.width,
            region.height,
            region.x,
            region.y,
            region.width,
            region.height
          );
        }
      }
    }
  }

  function applyPixelateBlock(
    targetContext,
    sourcePixelDataArray,
    sourceDataWidth,
    blockXInSource,
    blockYInSource,
    blockWidth,
    blockHeight
  ) {
    if (blockWidth <= 0 || blockHeight <= 0) return;

    let red = 0,
      green = 0,
      blue = 0,
      alpha = 0,
      count = 0;

    for (let y = 0; y < blockHeight; y++) {
      for (let x = 0; x < blockWidth; x++) {
        const sourcePixelX = blockXInSource + x;
        const sourcePixelY = blockYInSource + y;
        // Boundary check for sourcePixelX and sourcePixelY
        if (
          sourcePixelX >= 0 &&
          sourcePixelX < sourceDataWidth &&
          sourcePixelY >= 0 &&
          sourcePixelY < sourcePixelDataArray.length / (4 * sourceDataWidth)
        ) {
          const R_INDEX = (sourcePixelY * sourceDataWidth + sourcePixelX) * 4;
          if (R_INDEX + 3 < sourcePixelDataArray.length) {
            red += sourcePixelDataArray[R_INDEX];
            green += sourcePixelDataArray[R_INDEX + 1];
            blue += sourcePixelDataArray[R_INDEX + 2];
            alpha += sourcePixelDataArray[R_INDEX + 3];
            count++;
          }
        }
      }
    }

    if (count > 0) {
      targetContext.fillStyle = `rgba(${Math.floor(red / count)}, ${Math.floor(
        green / count
      )}, ${Math.floor(blue / count)}, ${alpha / count / 255})`;
      targetContext.fillRect(
        blockXInSource,
        blockYInSource,
        blockWidth,
        blockHeight
      );
    }
  }

  // Event listener for clear selection button
  clearSelectionBtn.addEventListener("click", clearSelection);

  const debouncedApplyEffect = debounce(applyEffect, 200);

  effectLevelRange.addEventListener("input", () => {
    effectLevelOutput.value = effectLevelRange.value; // Update output display
    debouncedApplyEffect();
  });

  censorTypeSelect.addEventListener("change", (e) => {
    currentCensorType = e.target.value;
    updateEffectControls();
    applyEffect();
  });

  function updateEffectControls() {
    if (currentCensorType === CENSOR_TYPE_PIXELATE) {
      effectLevelLabel.textContent = "Strength (Pixel Size):";
    } else if (currentCensorType === CENSOR_TYPE_BLUR) {
      effectLevelLabel.textContent = "Strength (Blur Radius):";
    } else if (currentCensorType === CENSOR_TYPE_PIXELATE_BLUR) {
      effectLevelLabel.textContent = "Strength (Pixel Size & Blur):";
    }
    effectLevelRange.min = "1";
    effectLevelRange.max = "100";
  }

  // Initial call to set up controls based on default censor type
  updateEffectControls();

  // Event listener for download button
  downloadBtn.addEventListener("click", () => {
    if (
      !pixelatedCanvas ||
      pixelatedCanvas.width <= 1 ||
      pixelatedCanvas.height <= 1 ||
      !uploadedImage
    ) {
      showMessageBox(
        "No image to download. Please upload and process an image first."
      );
      return;
    }
    setButtonLoading(
      downloadBtn,
      true,
      '<i class="fas fa-spinner fa-spin mr-2"></i>Preparing...'
    );
    setControlsDisabled(true, [downloadBtn]);

    setTimeout(() => {
      try {
        const dotIndex = currentOriginalFilename.lastIndexOf(".");
        const baseName =
          dotIndex === -1
            ? currentOriginalFilename
            : currentOriginalFilename.substring(0, dotIndex);
        const dataURL = pixelatedCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `${baseName}-${currentCensorType}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.error("Error during download preparation:", e);
        showMessageBox("Failed to prepare image for download.");
      } finally {
        setButtonLoading(downloadBtn, false);
        setControlsDisabled(false);
      }
    }, 10);
  });

  // Event listener for Share button
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      if (
        !uploadedImage ||
        !pixelatedCanvas ||
        pixelatedCanvas.width <= 1 ||
        pixelatedCanvas.height <= 1
      ) {
        showMessageBox(
          "No processed image to share. Please upload and process an image first."
        );
        return;
      }

      if (!navigator.share) {
        showMessageBox("Web Share API is not supported in your browser.");
        return;
      }

      setButtonLoading(
        shareBtn,
        true,
        '<i class="fas fa-spinner fa-spin mr-2"></i>Preparing Share...'
      );
      setControlsDisabled(true, [shareBtn]);

      pixelatedCanvas.toBlob(async (blob) => {
        if (!blob) {
          showMessageBox(
            "Could not create image blob for sharing. The canvas might be tainted or an error occurred."
          );
          setButtonLoading(shareBtn, false);
          setControlsDisabled(false);
          return;
        }

        const dotIndex = currentOriginalFilename.lastIndexOf(".");
        const baseName =
          dotIndex === -1
            ? currentOriginalFilename
            : currentOriginalFilename.substring(0, dotIndex);
        const fileName = `${baseName}-${currentCensorType}-shared.png`;
        const file = new File([blob], fileName, { type: "image/png" });

        const shareData = {
          files: [file],
          title: "Pixelated Image",
          text: `Check out this image I pixelated! Original: ${currentOriginalFilename}`
        };

        try {
          await navigator.share(shareData);
          showToast("Image shared successfully!");
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error sharing:", err);
            showMessageBox(`Could not share image: ${err.message}`);
          } else {
            showToast("Share cancelled.", 2000);
          }
        } finally {
          setButtonLoading(shareBtn, false);
          setControlsDisabled(false);
        }
      }, "image/png");
    });
  }

  // Ensure canvas and image containers resize responsively
  window.addEventListener("resize", () => {
    if (uploadedImage) {
      requestAnimationFrame(() => {
        if (
          !uploadedImage ||
          originalImage.clientWidth === 0 ||
          originalImage.clientHeight === 0
        )
          return;

        const hadBrushSelection = !isSelectionCanvasEmpty();
        let tempBrushCanvas = null;
        if (hadBrushSelection && activeTool === ACTIVE_TOOL_BRUSH) {
          // Only for brush
          tempBrushCanvas = document.createElement("canvas");
          tempBrushCanvas.width = selectionCanvas.width;
          tempBrushCanvas.height = selectionCanvas.height;
          const tempCtx = tempBrushCanvas.getContext("2d");
          tempCtx.drawImage(selectionCanvas, 0, 0);
        }

        const oldSelectionRects = JSON.parse(JSON.stringify(selectionRects));

        setupCanvasesForImage(uploadedImage);

        selectionRects = oldSelectionRects; // Restore original image coordinate rects
        currentDrawingRect = null;

        if (activeTool === ACTIVE_TOOL_RECTANGLE) {
          redrawSelectionLayer();
        } else if (
          activeTool === ACTIVE_TOOL_BRUSH &&
          hadBrushSelection &&
          tempBrushCanvas
        ) {
          selectionCtx.drawImage(
            tempBrushCanvas,
            0,
            0,
            tempBrushCanvas.width,
            tempBrushCanvas.height,
            0,
            0,
            selectionCanvas.width,
            selectionCanvas.height
          );
        } else {
          selectionCtx.clearRect(
            0,
            0,
            selectionCanvas.width,
            selectionCanvas.height
          );
        }

        saveSelectionState();
        applyEffect();
        updateToolUI();
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
      // currentHistoryIndex is 0 for the first actual state
      undoBtn.classList.remove(HIDDEN_CLASS);
    } else {
      undoBtn.classList.add(HIDDEN_CLASS);
    }
  }

  undoBtn.addEventListener("click", () => {
    if (currentHistoryIndex > 0) {
      setButtonLoading(
        undoBtn,
        true,
        '<i class="fas fa-undo mr-2"></i>Undoing...'
      );
      setControlsDisabled(true, [undoBtn]);

      setTimeout(() => {
        try {
          currentHistoryIndex--;
          const historyEntry = selectionHistory[currentHistoryIndex];

          selectionCtx.clearRect(
            0,
            0,
            selectionCanvas.width,
            selectionCanvas.height
          );

          if (historyEntry.tool === ACTIVE_TOOL_BRUSH) {
            selectionCtx.putImageData(historyEntry.data, 0, 0);
            selectionRects = []; // Clear rects if restoring brush state
          } else if (historyEntry.tool === ACTIVE_TOOL_RECTANGLE) {
            selectionRects = JSON.parse(JSON.stringify(historyEntry.data)); // Restore rects
            redrawSelectionLayer(); // Redraw restored rects
          }
          currentDrawingRect = null;
          applyEffect();
        } finally {
          setButtonLoading(undoBtn, false);
          setControlsDisabled(false);
          updateSelectionButtonsVisibility();
          updateUndoButtonState();
        }
      }, 10);
    }
  });

  // Event listener for Detect Faces button
  if (detectFacesBtn) {
    detectFacesBtn.addEventListener("click", async () => {
      if (!uploadedImage) {
        showMessageBox("Please upload an image first.");
        return;
      }
      if (!modelsLoaded || !faceapi || !faceapi.detectAllFaces) {
        showToast(
          "Face detection models not ready. Please wait or reload.",
          5000
        );
        if (!modelsLoaded && faceapi) await loadFaceApiModels();
        return;
      }

      setButtonLoading(
        detectFacesBtn,
        true,
        '<i class="fas fa-spinner fa-spin mr-2"></i>Detecting...'
      );
      setControlsDisabled(true, [detectFacesBtn]);

      setTimeout(async () => {
        try {
          if (activeTool !== ACTIVE_TOOL_BRUSH) {
            activeTool = ACTIVE_TOOL_BRUSH;
            selectionRects = []; // Clear any rectangles
            currentDrawingRect = null;
            selectionCtx.clearRect(
              0,
              0,
              selectionCanvas.width,
              selectionCanvas.height
            ); // Clear canvas for brush
            updateToolUI();
          }

          // selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height); // Don't clear if adding to existing brush
          // selectionRects = []; // Already handled if tool changed

          const detections = await faceapi.detectAllFaces(
            uploadedImage,
            new faceapi.TinyFaceDetectorOptions({
              scoreThreshold: 0.45,
              inputSize: 608
            })
          );

          if (!detections || detections.length === 0) {
            showToast("No faces detected.");
            setButtonLoading(detectFacesBtn, false);
            setControlsDisabled(false);
            return;
          }

          const scaleX = selectionCanvas.width / uploadedImage.naturalWidth;
          const scaleY = selectionCanvas.height / uploadedImage.naturalHeight;
          selectionCtx.fillStyle = BRUSH_DRAW_COLOR;
          const PADDING_SCALE_FACTOR = 1.4;
          const yOffsetFactor = 0.15;

          detections.forEach((detection) => {
            const originalFaceBox = detection.box;
            const paddedWidth = originalFaceBox.width * PADDING_SCALE_FACTOR;
            const paddedHeight = originalFaceBox.height * PADDING_SCALE_FACTOR;
            const paddedX =
              originalFaceBox.x - (paddedWidth - originalFaceBox.width) / 2;
            const paddedY =
              originalFaceBox.y - (paddedHeight - originalFaceBox.height) / 2;

            const scaledBoxX = paddedX * scaleX;
            const scaledBoxY = paddedY * scaleY;
            const scaledBoxWidth = paddedWidth * scaleX;
            const scaledBoxHeight = paddedHeight * scaleY;
            const yCorrection = scaledBoxHeight * yOffsetFactor;
            const centerX = scaledBoxX + scaledBoxWidth / 2;
            const centerY = scaledBoxY + scaledBoxHeight / 2 - yCorrection;
            const radius = Math.min(scaledBoxWidth, scaledBoxHeight) / 2;

            selectionCtx.beginPath();
            selectionCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            selectionCtx.fill();
          });
          saveSelectionState();
          applyEffect();
          showToast(`Detected ${detections.length} face(s).`);
        } catch (error) {
          console.error("Error during face detection:", error);
          showToast(
            "Error during face detection. Check console for details.",
            5000
          );
        } finally {
          setButtonLoading(detectFacesBtn, false);
          setControlsDisabled(false);
          updateSelectionButtonsVisibility();
          updateUndoButtonState();
        }
      }, 10);
    });
  }

  // Initial setup
  if (canvasPrompt) canvasPrompt.classList.remove(HIDDEN_CLASS);
  if (uploadPrompt) uploadPrompt.classList.remove(HIDDEN_CLASS);
  if (originalImageContainer)
    originalImageContainer.classList.add("items-center", "justify-center");
  if (originalImage) originalImage.classList.add(HIDDEN_CLASS);
  if (downloadBtn) downloadBtn.classList.add(HIDDEN_CLASS);
  if (shareBtn) shareBtn.classList.add(HIDDEN_CLASS);
  if (clearSelectionBtn) clearSelectionBtn.classList.add(HIDDEN_CLASS);
  if (undoBtn) undoBtn.classList.add(HIDDEN_CLASS);
  if (detectFacesBtn) detectFacesBtn.classList.add(HIDDEN_CLASS);

  updateToolUI();
  updateEffectControls();
  loadFaceApiModels();

  // Service Worker Registration and Share Target Handling
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
        })
        .catch((err) => {
          console.error("ServiceWorker registration failed: ", err);
        });
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (
        event.data &&
        event.data.type === "shared-image-file" &&
        event.data.file
      ) {
        const file = event.data.file;
        showToast("Image received via share. Loading...", 4000);
        if (file instanceof File && file.type.startsWith("image/")) {
          handleImageFile(file);
        } else {
          console.warn(
            "Received shared item is not a valid image File object:",
            file
          );
          showMessageBox(
            "Received shared file is not a valid image format or type."
          );
          setControlsDisabled(false);
        }
      }
    });
  }
});
