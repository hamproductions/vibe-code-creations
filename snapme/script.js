const video = document.getElementById('video');
const downloadLink = document.getElementById('download-link');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const cameraPreviewContainer = document.getElementById('camera-preview-container');
const cameraSelect = document.getElementById('camera-select');
const zoomControls = document.getElementById('zoom-controls');
const zoomSlider = document.getElementById('zoom-slider');
const settingsButton = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalButton = document.getElementById('close-modal-btn');
const menuButton = document.getElementById('menu-button');
const loadingSpinner = document.getElementById('loading-spinner');
const takePhotoRadio = document.getElementById('capture-takephoto');
const grabFrameRadio = document.getElementById('capture-grabframe');

let currentStream;
let imageCapture;
let selectedCaptureMethod = 'grabFrame';
let previewTimer;

// Function to start the camera stream
async function startCamera(cameraId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: cameraId ? { exact: cameraId } : undefined
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;

        // Initialize ImageCapture and check for zoom capabilities
        const track = currentStream.getVideoTracks()[0];
        if ('ImageCapture' in window && track) {
            imageCapture = new ImageCapture(track);
            const capabilities = await imageCapture.getPhotoCapabilities();

            if (capabilities.zoom) {
                zoomControls.classList.remove('hidden');
                zoomSlider.min = capabilities.zoom.min;
                zoomSlider.max = capabilities.zoom.max;
                zoomSlider.step = capabilities.zoom.step;
                zoomSlider.value = capabilities.zoom.current;
            } else {
                zoomControls.classList.add('hidden');
            }
        } else {
            zoomControls.classList.add('hidden');
        }
        return Promise.resolve(); // Resolve when imageCapture is ready

    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Could not access the camera. Please ensure you have a camera and have granted permission.");
        return Promise.reject(err); // Reject on error
    }
}

// Function to get available cameras and populate the dropdown
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        cameraSelect.innerHTML = ''; // Clear existing options

        if (videoDevices.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No cameras found';
            cameraSelect.appendChild(option);
            cameraSelect.disabled = true;
            return;
        }

        let defaultCameraId = null;
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
            // Check if this is a back camera
            if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')) {
                if (!defaultCameraId) {
                    defaultCameraId = device.deviceId;
                }
            }
        });

        // If no back camera found, use the first one
        if (!defaultCameraId && videoDevices.length > 0) {
            defaultCameraId = videoDevices[0].deviceId;
        }

        // Start camera with the determined default device
        if (defaultCameraId) {
            cameraSelect.value = defaultCameraId;
            startCamera(defaultCameraId);
        }

    } catch (err) {
        console.error("Error enumerating devices: ", err);
    }
}

// Initial camera setup
getCameras();

// Event listeners for capture method selection
takePhotoRadio.addEventListener('change', () => {
    selectedCaptureMethod = 'takePhoto';
    localStorage.setItem('snapmeCaptureMethod', 'takePhoto');
});

grabFrameRadio.addEventListener('change', () => {
    selectedCaptureMethod = 'grabFrame';
    localStorage.setItem('snapmeCaptureMethod', 'grabFrame');
});

// Open settings modal
settingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    getCameras(); // Populate cameras when modal opens

    // Load saved settings
    const savedCameraId = localStorage.getItem('snapmeCameraId');
    if (savedCameraId) {
        cameraSelect.value = savedCameraId;
        startCamera(savedCameraId); // Start camera with saved ID
    }

    const savedZoom = localStorage.getItem('snapmeZoom');
    if (savedZoom) {
        zoomSlider.value = savedZoom;
        if (currentStream && currentStream.getVideoTracks()[0].getCapabilities().zoom) {
            currentStream.getVideoTracks()[0].applyConstraints({ advanced: [{ zoom: parseFloat(savedZoom) }] });
        }
    }

    const savedCaptureMethod = localStorage.getItem('snapmeCaptureMethod');
    if (savedCaptureMethod) {
        selectedCaptureMethod = savedCaptureMethod;
        if (savedCaptureMethod === 'takePhoto') {
            takePhotoRadio.checked = true;
        } else {
            grabFrameRadio.checked = true;
        }
    }

    // Attach event listeners for cameraSelect and zoomSlider only once
    if (!cameraSelect.dataset.listenersAttached) {
        cameraSelect.addEventListener('change', (event) => {
            startCamera(event.target.value);
            localStorage.setItem('snapmeCameraId', event.target.value);
        });
        zoomSlider.addEventListener('input', () => {
            if (imageCapture) {
                const track = currentStream.getVideoTracks()[0];
                if (track.getCapabilities().zoom) {
                    track.applyConstraints({ advanced: [{ zoom: parseFloat(zoomSlider.value) }] });
                    localStorage.setItem('snapmeZoom', zoomSlider.value);
                }
            }
        });
        cameraSelect.dataset.listenersAttached = 'true';
    }
});

// Close settings modal
closeModalButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Event listener for camera selection change
cameraSelect.addEventListener('change', (event) => {
    startCamera(event.target.value);
});

// Event listener for zoom slider change
zoomSlider.addEventListener('input', () => {
    if (imageCapture) {
        const track = currentStream.getVideoTracks()[0];
        if (track.getCapabilities().zoom) {
            track.applyConstraints({ advanced: [{ zoom: parseFloat(zoomSlider.value) }] });
        }
    }
});

// Function to capture image
async function captureImage() {
    if (!imageCapture) {
        console.error("ImageCapture is not initialized.");
        return;
    }

    let photoBlob;
    if (selectedCaptureMethod === 'takePhoto') {
        try {
            photoBlob = await imageCapture.takePhoto();
        } catch (error) {
            console.error("Error capturing photo with takePhoto(): ", error);
            return;
        }
    } else if (selectedCaptureMethod === 'grabFrame') {
        try {
            const imageBitmap = await imageCapture.grabFrame();
            const canvas = document.createElement('canvas');
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            const context = canvas.getContext('2d');
            context.drawImage(imageBitmap, 0, 0);
            photoBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } catch (error) {
            console.error("Error capturing photo with grabFrame(): ", error);
            return;
        }
    }

    if (photoBlob) {
        const imageUrl = URL.createObjectURL(photoBlob);
        downloadLink.href = imageUrl;
        downloadLink.download = `snapme-${new Date().getTime()}.png`;
        downloadLink.click();
        URL.revokeObjectURL(imageUrl); // Clean up the object URL

        // Simulate sending a message with the image
        appendMessage('sent', 'Image captured!');
    }
}

// Function to append messages to the chat
function appendMessage(type, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = text;
    chatMessages.prepend(messageElement); // Add to top to simulate reverse order
}

// Send message when button is clicked or enter is pressed
sendButton.addEventListener('click', async () => {
    let messageText = messageInput.value.trim();
    if (!messageText) {
        const randomMessages = [
            "Hello there!",
            "How are you?",
            "What's up?",
            "Nice day, isn't it?",
            "Just saying hi!"
        ];
        messageText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    }

    appendMessage('sent', messageText);
    messageInput.value = '';

    // Show loading spinner
        loadingSpinner.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom to show spinner

    // Capture image when send button is pressed
        await captureImage();

    // Simulate a received message after a short delay
    setTimeout(() => {
        const randomResponses = [
            "That's interesting!",
            "Tell me more.",
            "I see.",
            "Hmm, I'll have to think about that.",
            "Got it!"
        ];
        const replyText = randomResponses[Math.floor(Math.random() * randomResponses.length)];
        appendMessage('received', replyText);

        // Hide loading spinner
            loadingSpinner.style.display = 'none';
    }, 500);
});

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});

// Menu button functionality (long press for preview)
menuButton.addEventListener('mousedown', () => {
    previewTimer = setTimeout(() => {
        cameraPreviewContainer.classList.remove('hidden');
    }, 500);
});

menuButton.addEventListener('mouseup', () => {
    clearTimeout(previewTimer);
    cameraPreviewContainer.classList.add('hidden');
});

menuButton.addEventListener('mouseleave', () => {
    clearTimeout(previewTimer);
    cameraPreviewContainer.classList.add('hidden');
});

menuButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    previewTimer = setTimeout(() => {
        cameraPreviewContainer.classList.remove('hidden');
    }, 500);
});

menuButton.addEventListener('touchend', () => {
    clearTimeout(previewTimer);
    cameraPreviewContainer.classList.add('hidden');
});

menuButton.addEventListener('touchcancel', () => {
    clearTimeout(previewTimer);
    cameraPreviewContainer.classList.add('hidden');
});
