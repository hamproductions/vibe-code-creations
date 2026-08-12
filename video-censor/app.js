const { useState, useEffect, useRef, useCallback } = React;

function App() {
  const [modelStatus, setModelStatus] = useState('Initializing MediaPipe...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [target, setTarget] = useState('background');
  const [pixelSize, setPixelSize] = useState(25);
  const [offset, setOffset] = useState(10);
  const [feather, setFeather] = useState(15);
  const [smoothing, setSmoothing] = useState(0.75);
  const [debugMode, setDebugMode] = useState(false);
  const [metrics, setMetrics] = useState({ fps: 0, latency: 0 });
  const [time, setTime] = useState({ current: 0, duration: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const segmenterRef = useRef(null);
  const reqRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const isSegmentingRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const framesRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const emaMaskRef = useRef(null);
  const objectUrlRef = useRef(null);

  const ctxRefs = useRef({
    main: null,
    pixel: null,
    rawMask: null,
    morph: null,
    finalMask: null,
    redTint: null,
    maskData: null,
    canvases: {}
  });

  useEffect(() => {
    let active = true;
    const initModel = async () => {
      try {
        const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm');
        const { ImageSegmenter, FilesetResolver } = visionModule;
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });
        if (active) {
          segmenterRef.current = segmenter;
          setModelStatus('Ready. Upload a video.');
        }
      } catch (err) {
        if (active) setModelStatus(`Failed to load model: ${err.message}`);
      }
    };
    initModel();
    return () => {
      active = false;
      if (segmenterRef.current?.close) segmenterRef.current.close();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const setupCanvases = (w, h) => {
    if (!canvasRef.current) return;
    const mainCanvas = canvasRef.current;
    mainCanvas.width = w;
    mainCanvas.height = h;

    const createOffscreen = () => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return { canvas: c, ctx: c.getContext('2d', { willReadFrequently: true }) };
    };

    const pixel = createOffscreen();
    const rawMask = createOffscreen();
    const morph = createOffscreen();
    const finalMask = createOffscreen();
    const redTint = createOffscreen();

    emaMaskRef.current = new Float32Array(w * h);
    ctxRefs.current = {
      main: mainCanvas.getContext('2d'),
      pixel: pixel.ctx,
      rawMask: rawMask.ctx,
      morph: morph.ctx,
      finalMask: finalMask.ctx,
      redTint: redTint.ctx,
      maskData: rawMask.ctx.createImageData(w, h),
      canvases: {
        pixel: pixel.canvas,
        rawMask: rawMask.canvas,
        morph: morph.canvas,
        finalMask: finalMask.canvas,
        redTint: redTint.canvas
      }
    };
  };

  const executePipeline = (video, startMs) => {
    segmenterRef.current.segmentForVideo(video, startMs, (result) => {
      const { main, rawMask, morph, finalMask, redTint, maskData, canvases } = ctxRefs.current;
      if (!main) return;

      const w = video.videoWidth;
      const h = video.videoHeight;

      if (result.categoryMask) {
        const pSize = Math.max(1, pixelSize);
        const sw = Math.ceil(w / pSize);
        const sh = Math.ceil(h / pSize);
        const pixel = ctxRefs.current.pixel;
        canvases.pixel.width = sw;
        canvases.pixel.height = sh;
        pixel.drawImage(video, 0, 0, sw, sh);

        const maskArray = result.categoryMask.getAsUint8Array();
        const data = maskData.data;
        const len = Math.min(maskArray.length, emaMaskRef.current.length);
        const ema = emaMaskRef.current;
        const invSmooth = 1 - smoothing;

        for (let i = 0; i < len; ++i) {
          const isPerson = maskArray[i] !== 0;
          const isTarget = target === 'human' ? isPerson : !isPerson;
          ema[i] = (ema[i] * smoothing) + ((isTarget ? 255 : 0) * invSmooth);
          const pxOffset = i << 2;
          data[pxOffset] = 0;
          data[pxOffset + 1] = 0;
          data[pxOffset + 2] = 0;
          data[pxOffset + 3] = ema[i];
        }
        rawMask.putImageData(maskData, 0, 0);

        morph.clearRect(0, 0, w, h);
        const absOffset = Math.abs(offset);
        if (absOffset > 0) {
          morph.filter = `blur(${absOffset}px)`;
          morph.drawImage(canvases.rawMask, 0, 0);
          morph.filter = 'none';
          if (offset > 0) {
            morph.globalCompositeOperation = 'source-over';
            for (let i = 0; i < 4; i++) morph.drawImage(canvases.morph, 0, 0);
          } else {
            morph.globalCompositeOperation = 'destination-in';
            for (let i = 0; i < 4; i++) morph.drawImage(canvases.morph, 0, 0);
            morph.globalCompositeOperation = 'source-over';
          }
        } else {
          morph.drawImage(canvases.rawMask, 0, 0);
        }

        finalMask.clearRect(0, 0, w, h);
        finalMask.filter = feather > 0 ? `blur(${feather}px)` : 'none';
        finalMask.drawImage(canvases.morph, 0, 0);
        finalMask.filter = 'none';

        if (debugMode) {
          main.drawImage(video, 0, 0, w, h);
          redTint.clearRect(0, 0, w, h);
          redTint.fillStyle = 'rgba(255, 0, 0, 0.65)';
          redTint.fillRect(0, 0, w, h);
          redTint.globalCompositeOperation = 'destination-in';
          redTint.drawImage(canvases.finalMask, 0, 0);
          redTint.globalCompositeOperation = 'source-over';
          main.drawImage(canvases.redTint, 0, 0, w, h);
        } else {
          main.drawImage(video, 0, 0, w, h);
          redTint.clearRect(0, 0, w, h);
          redTint.imageSmoothingEnabled = false;
          redTint.drawImage(canvases.pixel, 0, 0, sw, sh, 0, 0, w, h);
          redTint.globalCompositeOperation = 'destination-in';
          redTint.drawImage(canvases.finalMask, 0, 0);
          redTint.globalCompositeOperation = 'source-over';
          main.drawImage(canvases.redTint, 0, 0, w, h);
        }
        result.categoryMask.close?.();
      } else {
        main.drawImage(video, 0, 0, w, h);
      }
    });
  };

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !segmenterRef.current || video.videoWidth === 0) {
      reqRef.current = requestAnimationFrame(processFrame);
      return;
    }
    if (!isPlaying && !isExporting && video.currentTime === lastVideoTimeRef.current) {
      reqRef.current = requestAnimationFrame(processFrame);
      return;
    }
    if (isSegmentingRef.current) {
      reqRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const startMs = performance.now();
    isSegmentingRef.current = true;
    lastVideoTimeRef.current = video.currentTime;
    if (isPlaying || isExporting) setTime(prev => ({ ...prev, current: video.currentTime }));

    try {
      executePipeline(video, startMs);
      const endMs = performance.now();
      framesRef.current++;
      if (endMs - lastFpsTimeRef.current >= 1000) {
        setMetrics({ fps: framesRef.current, latency: Math.round(endMs - startMs) });
        framesRef.current = 0;
        lastFpsTimeRef.current = endMs;
      }
    } catch (e) {
      console.error('Segmentation error:', e);
    }

    isSegmentingRef.current = false;
    reqRef.current = requestAnimationFrame(processFrame);
  }, [pixelSize, offset, feather, target, smoothing, debugMode, isPlaying, isExporting]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(reqRef.current);
  }, [processFrame]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    const video = videoRef.current;
    video.src = objectUrl;
    video.load();
    video.onloadeddata = () => {
      setupCanvases(video.videoWidth, video.videoHeight);
      setTime({ current: 0, duration: video.duration });
      setModelStatus('Video loaded. Ready to play/render.');
      setIsProcessing(true);
      lastVideoTimeRef.current = -1;
    };
    video.onended = () => {
      setIsPlaying(false);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    };
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !video.src) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(err => setModelStatus(`Playback failed: ${err.message}`));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setTime(prev => ({ ...prev, current: newTime }));
    if (emaMaskRef.current) emaMaskRef.current.fill(0);
    lastVideoTimeRef.current = -1;
  };

  const startExport = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isFinite(time.duration) || time.duration <= 0) return;
    video.pause();
    video.currentTime = 0;
    if (emaMaskRef.current) emaMaskRef.current.fill(0);

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
      ? 'video/webm; codecs=vp9'
      : 'video/webm';
    recorderRef.current = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    chunksRef.current = [];
    recorderRef.current.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'censored_video.webm';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      setIsExporting(false);
      setIsPlaying(false);
      video.pause();
    };
    setIsExporting(true);
    recorderRef.current.start();
    video.play().catch(err => {
      recorderRef.current.stop();
      setModelStatus(`Export failed: ${err.message}`);
    });
    setIsPlaying(true);
  };

  const formatTime = secs => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-6 flex flex-col xl:flex-row gap-6">
      <div className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-5 bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-2xl h-fit">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Censor Studio Pro</h1>
          <p id="model-status" className="text-xs text-neutral-400">{modelStatus}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm mb-2 text-neutral-300 font-semibold">Video Source</label>
            <input
              id="video-input"
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              disabled={isExporting}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer disabled:opacity-50"
            />
          </div>
          <div className="h-px bg-neutral-800"></div>
          <div>
            <label className="block text-sm mb-2 text-neutral-300 font-semibold">Target</label>
            <select value={target} onChange={e => setTarget(e.target.value)} disabled={isExporting} className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="background">Background (Default)</option>
              <option value="human">Human (Subject)</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-neutral-300 font-semibold">Temporal Smoothing</label>
              <span className="text-white">{smoothing.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="0.95" step="0.05" value={smoothing} onChange={e => setSmoothing(Number(e.target.value))} disabled={isExporting} className="w-full accent-blue-500 disabled:opacity-50" />
            <p className="text-[10px] text-neutral-500 mt-1 leading-tight">Prevents mask jitter/glitching across frames.</p>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-neutral-300 font-semibold">Pixel Block Size</label>
              <span className="text-white">{pixelSize}px</span>
            </div>
            <input type="range" min="2" max="100" value={pixelSize} onChange={e => setPixelSize(Number(e.target.value))} disabled={isExporting} className="w-full accent-blue-500 disabled:opacity-50" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-neutral-300 font-semibold">Mask Expand/Shrink</label>
              <span className="text-white">{offset > 0 ? '+' : ''}{offset}px</span>
            </div>
            <input type="range" min="-30" max="50" value={offset} onChange={e => setOffset(Number(e.target.value))} disabled={isExporting} className="w-full accent-blue-500 disabled:opacity-50" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-neutral-300 font-semibold">Edge Feather Radius</label>
              <span className="text-white">{feather}px</span>
            </div>
            <input type="range" min="0" max="100" value={feather} onChange={e => setFeather(Number(e.target.value))} disabled={isExporting} className="w-full accent-blue-500 disabled:opacity-50" />
          </div>
          <div className="pt-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="debugMode" checked={debugMode} onChange={e => setDebugMode(e.target.checked)} disabled={isExporting} className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-600 focus:ring-offset-neutral-900 disabled:opacity-50" />
              <label htmlFor="debugMode" className="text-sm text-red-400 cursor-pointer font-bold">Show Final Mask (Debug)</label>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="mt-2 p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
            <div className="text-xs text-blue-400 mb-2 uppercase tracking-wider font-semibold">Render Progress</div>
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${Math.min(100, (time.current / time.duration) * 100)}%` }}></div>
            </div>
            <div className="text-xs text-right text-blue-300">{Math.round((time.current / time.duration) * 100)}%</div>
          </div>
        )}

        <div className="mt-auto p-4 bg-black/50 rounded-lg border border-neutral-800">
          <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold">Pipeline Metrics</div>
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xl text-white">{metrics.fps}</div><div className="text-[10px] text-neutral-500">FPS</div></div>
            <div><div className="text-xl text-white">{metrics.latency}<span className="text-sm text-neutral-500 ml-1">ms</span></div><div className="text-[10px] text-neutral-500">LATENCY</div></div>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-4 min-w-0">
        <div className="flex-grow flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden relative min-h-[50vh]">
          <canvas ref={canvasRef} id="output-canvas" className="max-w-full max-h-[75vh] object-contain"></canvas>
          <video ref={videoRef} id="source-video" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} muted playsInline></video>
          {!isProcessing && <div id="empty-state" className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">Upload a video to begin</div>}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <span className="text-xs text-neutral-400 w-12 text-right tabular-nums">{formatTime(time.current)}</span>
            <input id="timeline" type="range" min="0" max={time.duration || 100} step="0.01" value={time.current} onChange={handleSeek} disabled={isExporting || !isProcessing} className="flex-grow accent-blue-500 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
            <span className="text-xs text-neutral-400 w-12 tabular-nums">{formatTime(time.duration)}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <button id="play-button" onClick={togglePlay} disabled={isExporting || !isProcessing} className="px-8 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500">{isPlaying ? 'Pause' : 'Play'}</button>
            <button id="render-button" onClick={startExport} disabled={isExporting || !isProcessing || isPlaying} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400">{isExporting ? 'Rendering...' : 'Render to File'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
