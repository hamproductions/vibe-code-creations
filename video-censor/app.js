const { useState, useEffect, useRef } = React;

const VISION_VERSION = '0.10.3';
const MODEL_BASE = 'https://storage.googleapis.com/mediapipe-models/image_segmenter';
const MODELS = {
  deeplab: {
    label: 'DeepLab v3 (accurate, best for dark/odd scenes)',
    url: `${MODEL_BASE}/deeplab_v3/float32/latest/deeplab_v3.tflite`,
    person: (masks) => masks[15]
  },
  multiclass: {
    label: 'Selfie Multiclass (balanced)',
    url: `${MODEL_BASE}/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite`,
    person: (masks) => masks[0] && { inverse: masks[0] }
  },
  selfie: {
    label: 'Selfie (fast, close-up only)',
    url: `${MODEL_BASE}/selfie_segmenter/float16/latest/selfie_segmenter.tflite`,
    person: (masks) => masks[0]
  }
};

const MODEL_LONG_SIDE = 384;
const MASK_LONG_SIDE = 512;

// ---------- image helpers ----------

// Tiled CLAHE on luminance with temporal smoothing of the lookup tables so
// low-contrast / dark footage becomes readable for the segmentation model
// without flickering.
const CLAHE_GX = 8;
const CLAHE_GY = 6;
function createClahe() {
  return { luts: new Float32Array(CLAHE_GX * CLAHE_GY * 256), ready: false, y: null };
}
function applyClahe(img, w, h, st, strength, fresh) {
  const d = img.data;
  const n = w * h;
  if (!st.y || st.y.length !== n) st.y = new Uint8Array(n);
  const Y = st.y;
  for (let i = 0, p = 0; i < n; i++, p += 4) Y[i] = (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8;

  const hist = new Uint32Array(256);
  const keep = st.ready && !fresh ? 0.8 : 0;
  for (let ty = 0; ty < CLAHE_GY; ty++) {
    const y0 = Math.floor((ty * h) / CLAHE_GY);
    const y1 = Math.floor(((ty + 1) * h) / CLAHE_GY);
    for (let tx = 0; tx < CLAHE_GX; tx++) {
      const x0 = Math.floor((tx * w) / CLAHE_GX);
      const x1 = Math.floor(((tx + 1) * w) / CLAHE_GX);
      hist.fill(0);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) hist[Y[y * w + x]]++;
      const count = Math.max(1, (x1 - x0) * (y1 - y0));
      const clip = Math.max(1, (3 * count) / 256);
      let excess = 0;
      for (let b = 0; b < 256; b++) {
        if (hist[b] > clip) {
          excess += hist[b] - clip;
          hist[b] = clip;
        }
      }
      const add = excess / 256;
      let acc = 0;
      const base = (ty * CLAHE_GX + tx) * 256;
      for (let b = 0; b < 256; b++) {
        acc += hist[b] + add;
        const v = (255 * acc) / count;
        st.luts[base + b] = st.luts[base + b] * keep + v * (1 - keep);
      }
    }
  }
  st.ready = true;

  const tw = w / CLAHE_GX;
  const th = h / CLAHE_GY;
  const xi0 = new Int32Array(w), xi1 = new Int32Array(w), xw = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const f = x / tw - 0.5;
    const a = Math.floor(f);
    xw[x] = f - a;
    xi0[x] = Math.min(CLAHE_GX - 1, Math.max(0, a));
    xi1[x] = Math.min(CLAHE_GX - 1, Math.max(0, a + 1));
  }
  const L = st.luts;
  for (let y = 0; y < h; y++) {
    const f = y / th - 0.5;
    const a = Math.floor(f);
    const wy = f - a;
    const r0 = Math.min(CLAHE_GY - 1, Math.max(0, a)) * CLAHE_GX;
    const r1 = Math.min(CLAHE_GY - 1, Math.max(0, a + 1)) * CLAHE_GX;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const yv = Y[i];
      const wx = xw[x];
      const top = L[(r0 + xi0[x]) * 256 + yv] * (1 - wx) + L[(r0 + xi1[x]) * 256 + yv] * wx;
      const bot = L[(r1 + xi0[x]) * 256 + yv] * (1 - wx) + L[(r1 + xi1[x]) * 256 + yv] * wx;
      const eq = top * (1 - wy) + bot * wy;
      const ny = yv + (eq - yv) * strength;
      const gain = Math.min(10, (ny + 1) / (yv + 1));
      const p = i << 2;
      d[p] = Math.min(255, d[p] * gain);
      d[p + 1] = Math.min(255, d[p + 1] * gain);
      d[p + 2] = Math.min(255, d[p + 2] * gain);
    }
  }
}

// Separable max (dilate) / min (erode) filter on a float mask.
function morphMask(src, tmp, w, h, r, dilate) {
  if (r <= 0) return src;
  const pick = dilate ? Math.max : Math.min;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let v = src[row + x];
      const a = Math.max(0, x - r), b = Math.min(w - 1, x + r);
      for (let k = a; k <= b; k++) v = pick(v, src[row + k]);
      tmp[row + x] = v;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let v = tmp[y * w + x];
      const a = Math.max(0, y - r), b = Math.min(h - 1, y + r);
      for (let k = a; k <= b; k++) v = pick(v, tmp[k * w + x]);
      src[y * w + x] = v;
    }
  }
  return src;
}

const smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const makeCanvas = (w, h, readback) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return { canvas: c, ctx: c.getContext('2d', readback ? { willReadFrequently: true } : undefined) };
};

const Row = ({ label, value, children, hint }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <label className="text-neutral-300 font-semibold">{label}</label>
      <span className="text-white">{value}</span>
    </div>
    {children}
    {hint && <p className="text-[10px] text-neutral-500 mt-1 leading-tight">{hint}</p>}
  </div>
);

function App() {
  const [modelStatus, setModelStatus] = useState('Upload a video.');
  const [modelReady, setModelReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [target, setTarget] = useState('full');
  const [style, setStyle] = useState('pixelate');
  const [model, setModel] = useState('deeplab');
  const [pixelSize, setPixelSize] = useState(25);
  const [offset, setOffset] = useState(10);
  const [feather, setFeather] = useState(12);
  const [smoothing, setSmoothing] = useState(0.5);
  const [threshold, setThreshold] = useState(0.45);
  const [enhance, setEnhance] = useState(0.7);
  const [view, setView] = useState('result');
  const [maxRes, setMaxRes] = useState(1080);
  const [metrics, setMetrics] = useState({ fps: 0, latency: 0 });
  const [time, setTime] = useState({ current: 0, duration: 0 });

  const settings = { target, style, pixelSize, offset, feather, smoothing, threshold, enhance, view };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const segmenterRef = useRef(null);
  const gfxRef = useRef(null);
  const loopTokenRef = useRef(0);
  const lastTsRef = useRef(0);
  const framesRef = useRef(0);
  const lastFpsRef = useRef(performance.now());
  const lastTimeUiRef = useRef(0);
  const emaRef = useRef({ data: null, w: 0, h: 0 });
  const claheRef = useRef(createClahe());
  const objectUrlRef = useRef(null);
  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const exportingRef = useRef(false);

  // ---------- model ----------
  useEffect(() => {
    let active = true;
    setModelReady(false);
    const prev = segmenterRef.current;
    segmenterRef.current = null;
    if (prev?.close) prev.close();
    if (target === 'full') return;
    setModelStatus('Loading segmentation model...');
    (async () => {
      try {
        const { ImageSegmenter, FilesetResolver } = await import(
          `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/+esm`
        );
        const vision = await FilesetResolver.forVisionTasks(
          `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`
        );
        const create = (delegate) =>
          ImageSegmenter.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODELS[model].url, delegate },
            runningMode: 'VIDEO',
            outputCategoryMask: false,
            outputConfidenceMasks: true
          });
        let seg;
        try {
          seg = await create('GPU');
        } catch (e) {
          seg = await create('CPU');
        }
        if (!active) return seg.close();
        segmenterRef.current = seg;
        setModelReady(true);
        setModelStatus('Model ready.');
      } catch (err) {
        if (active) setModelStatus(`Failed to load model: ${err.message}`);
      }
    })();
    return () => {
      active = false;
    };
  }, [model, target === 'full']);

  useEffect(
    () => () => {
      segmenterRef.current?.close?.();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  // ---------- canvases ----------
  const setupGraphics = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const scale = Math.min(1, maxRes / Math.max(video.videoWidth, video.videoHeight));
    // even dimensions keep encoders happy
    const W = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    const H = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);
    canvas.width = W;
    canvas.height = H;
    const ms = MODEL_LONG_SIDE / Math.max(W, H);
    const mcs = MASK_LONG_SIDE / Math.max(W, H);
    gfxRef.current = {
      W, H,
      main: canvas.getContext('2d', { alpha: false }),
      tiny: makeCanvas(W, H),
      fx: makeCanvas(W, H),
      layer: makeCanvas(W, H),
      modelIn: makeCanvas(W * ms, H * ms, true),
      maskCanvas: makeCanvas(W * Math.min(1, mcs), H * Math.min(1, mcs)),
      maskSmall: null
    };
    emaRef.current = { data: null, w: 0, h: 0 };
    claheRef.current = createClahe();
  };

  useEffect(() => {
    if (loaded) {
      setupGraphics();
      renderFrame(true);
      // the first decoded frame can land a tick after loadeddata
      videoRef.current.requestVideoFrameCallback?.(() => videoRef.current.paused && renderFrame(true));
    }
  }, [maxRes, loaded]);

  // ---------- rendering ----------
  const drawCensorFx = (g, video, s) => {
    const { fx, tiny, W, H } = g;
    const ctx = fx.ctx;
    ctx.globalCompositeOperation = 'source-over';
    if (s.style === 'black') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const p = Math.max(2, s.pixelSize);
    const sw = Math.max(1, Math.ceil(W / p));
    const sh = Math.max(1, Math.ceil(H / p));
    if (s.style === 'blur') {
      // heavy blur at reduced resolution; cheap and smooth
      const bw = Math.max(8, Math.ceil(W / 6));
      const bh = Math.max(8, Math.ceil(H / 6));
      if (tiny.canvas.width !== bw) tiny.canvas.width = bw;
      if (tiny.canvas.height !== bh) tiny.canvas.height = bh;
      tiny.ctx.filter = `blur(${Math.max(1, p / 12)}px)`;
      tiny.ctx.drawImage(video, 0, 0, bw, bh);
      tiny.ctx.filter = 'none';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tiny.canvas, 0, 0, bw, bh, 0, 0, W, H);
    } else {
      if (tiny.canvas.width !== sw) tiny.canvas.width = sw;
      if (tiny.canvas.height !== sh) tiny.canvas.height = sh;
      tiny.ctx.drawImage(video, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tiny.canvas, 0, 0, sw, sh, 0, 0, W, H);
    }
  };

  // Runs segmentation, returns personProb Float32Array (+dims) or null
  const segment = (g, video, s, fresh) => {
    const seg = segmenterRef.current;
    if (!seg) return null;
    const { modelIn } = g;
    const mw = modelIn.canvas.width, mh = modelIn.canvas.height;
    modelIn.ctx.drawImage(video, 0, 0, mw, mh);
    if (s.enhance > 0.01) {
      const img = modelIn.ctx.getImageData(0, 0, mw, mh);
      applyClahe(img, mw, mh, claheRef.current, s.enhance, fresh);
      modelIn.ctx.putImageData(img, 0, 0);
    }
    const ts = Math.max(performance.now(), lastTsRef.current + 1);
    lastTsRef.current = ts;
    let out = null;
    seg.segmentForVideo(modelIn.canvas, ts, (result) => {
      const masks = result.confidenceMasks;
      if (!masks || !masks.length) return;
      const pick = MODELS[model].person(masks);
      if (!pick) return;
      const inverse = !!pick.inverse;
      const m = inverse ? pick.inverse : pick;
      const arr = m.getAsFloat32Array();
      const prob = new Float32Array(arr.length);
      for (let i = 0; i < arr.length; i++) prob[i] = inverse ? 1 - arr[i] : arr[i];
      out = { prob, w: m.width, h: m.height };
    });
    return out;
  };

  const buildMask = (g, seg, s, fresh) => {
    const { prob, w, h } = seg;
    let ema = emaRef.current;
    if (!ema.data || ema.w !== w || ema.h !== h) ema = emaRef.current = { data: new Float32Array(w * h), w, h };
    const e = ema.data;
    const keep = fresh ? 0 : s.smoothing;
    const t = s.threshold;
    const humanTarget = s.target === 'human';
    const tm = new Float32Array(w * h);
    for (let i = 0; i < e.length; i++) {
      e[i] = e[i] * keep + prob[i] * (1 - keep);
      const m = smoothstep((e[i] - (t - 0.1)) / 0.2);
      tm[i] = humanTarget ? m : 1 - m;
    }
    const r = Math.round((Math.abs(s.offset) * w) / g.W);
    if (r > 0) morphMask(tm, new Float32Array(w * h), w, h, r, s.offset > 0);

    if (!g.maskSmall || g.maskSmall.canvas.width !== w || g.maskSmall.canvas.height !== h) {
      g.maskSmall = makeCanvas(w, h, true);
      g.maskImg = g.maskSmall.ctx.createImageData(w, h);
    }
    const d = g.maskImg.data;
    for (let i = 0, p = 0; i < tm.length; i++, p += 4) d[p + 3] = tm[i] * 255;
    g.maskSmall.ctx.putImageData(g.maskImg, 0, 0);

    const { maskCanvas } = g;
    const mc = maskCanvas.canvas;
    const mcs = mc.width / g.W;
    const blur = s.feather * mcs;
    const pad = Math.ceil(blur * 2);
    const mctx = maskCanvas.ctx;
    mctx.clearRect(0, 0, mc.width, mc.height);
    mctx.filter = blur > 0.3 ? `blur(${blur}px)` : 'none';
    // draw slightly oversized so the blur does not fade out (and leak) at the frame edges
    mctx.drawImage(g.maskSmall.canvas, -pad, -pad, mc.width + pad * 2, mc.height + pad * 2);
    mctx.filter = 'none';
  };

  const renderFrame = (fresh) => {
    const g = gfxRef.current;
    const video = videoRef.current;
    if (!g || !video || video.readyState < 2) return;
    const s = settingsRef.current;
    const t0 = performance.now();
    const { main, layer, fx, W, H } = g;
    try {
      main.drawImage(video, 0, 0, W, H);

      const full = s.target === 'full';
      let seg = null;
      if (!full) {
        seg = segment(g, video, s, fresh);
        if (seg) buildMask(g, seg, s, fresh);
      }

      if (s.view === 'input' && !full) {
        main.drawImage(g.modelIn.canvas, 0, 0, W, H);
      } else if (full) {
        drawCensorFx(g, video, s);
        main.drawImage(fx.canvas, 0, 0);
      } else if (seg) {
        const lctx = layer.ctx;
        lctx.globalCompositeOperation = 'source-over';
        lctx.clearRect(0, 0, W, H);
        if (s.view === 'mask') {
          lctx.fillStyle = 'rgba(255,0,0,0.65)';
          lctx.fillRect(0, 0, W, H);
        } else {
          drawCensorFx(g, video, s);
          lctx.drawImage(fx.canvas, 0, 0);
        }
        lctx.globalCompositeOperation = 'destination-in';
        lctx.imageSmoothingEnabled = true;
        lctx.drawImage(g.maskCanvas.canvas, 0, 0, W, H);
        lctx.globalCompositeOperation = 'source-over';
        main.drawImage(layer.canvas, 0, 0);
      } else {
        // model not ready: never leak the raw frame while a censor target is selected
        main.fillStyle = '#000';
        main.fillRect(0, 0, W, H);
      }
    } catch (e) {
      console.error('Render error:', e);
    }

    const now = performance.now();
    framesRef.current++;
    if (now - lastFpsRef.current >= 1000) {
      setMetrics({ fps: framesRef.current, latency: Math.round(now - t0) });
      framesRef.current = 0;
      lastFpsRef.current = now;
    }
    if (now - lastTimeUiRef.current > 200) {
      lastTimeUiRef.current = now;
      setTime((prev) => ({ ...prev, current: video.currentTime }));
    }
  };

  // re-render on setting changes while paused / model ready
  useEffect(() => {
    const v = videoRef.current;
    if (loaded && v && v.paused) renderFrame(true);
  }, [target, style, pixelSize, offset, feather, smoothing, threshold, enhance, view, modelReady, model]);

  // ---------- playback loop (driven by actual video frames) ----------
  const startLoop = () => {
    const video = videoRef.current;
    const token = ++loopTokenRef.current;
    let lastMediaTime = -1;
    const tick = () => {
      if (token !== loopTokenRef.current) return;
      if (video.currentTime !== lastMediaTime) {
        lastMediaTime = video.currentTime;
        renderFrame(false);
      }
      schedule();
    };
    const schedule = () => {
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(tick);
      else requestAnimationFrame(tick);
    };
    schedule();
  };
  const stopLoop = () => {
    loopTokenRef.current++;
  };

  // ---------- audio routing (preview sound + export capture) ----------
  const ensureAudio = () => {
    if (!audioRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(videoRef.current);
      const preview = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();
      src.connect(preview);
      preview.connect(ctx.destination);
      src.connect(dest);
      audioRef.current = { ctx, preview, dest };
    }
    if (audioRef.current.ctx.state === 'suspended') audioRef.current.ctx.resume();
    return audioRef.current;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    stopLoop();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    const video = videoRef.current;
    setLoaded(false);
    setIsPlaying(false);
    video.src = objectUrlRef.current;
    video.load();
  };

  const onLoadedData = () => {
    const video = videoRef.current;
    setTime({ current: 0, duration: video.duration });
    setLoaded(true);
    setModelStatus('Video loaded.');
  };

  const onEnded = () => {
    stopLoop();
    renderFrame(false);
    setIsPlaying(false);
    if (exportingRef.current) setTimeout(() => recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop(), 250);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !video.src) return;
    if (video.paused) {
      ensureAudio();
      video.play().catch((err) => setModelStatus(`Playback failed: ${err.message}`));
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    setTime((prev) => ({ ...prev, current: t }));
  };

  // ---------- export (real-time capture with audio) ----------
  const finishExport = () => {
    exportingRef.current = false;
    if (audioRef.current) audioRef.current.preview.gain.value = 1;
    setIsExporting(false);
  };

  const cancelExport = () => {
    const rec = recorderRef.current;
    if (rec) rec.cancelled = true;
    if (rec && rec.state !== 'inactive') rec.stop();
    videoRef.current.pause();
    finishExport();
  };

  const startExport = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!loaded || !isFinite(time.duration) || time.duration <= 0) return;
    if (settingsRef.current.target !== 'full' && !segmenterRef.current) {
      setModelStatus('Model still loading, wait a moment.');
      return;
    }
    video.pause();
    await new Promise((res) => {
      video.addEventListener('seeked', res, { once: true });
      video.currentTime = 0;
    });
    emaRef.current = { data: null, w: 0, h: 0 };
    renderFrame(true);

    const audio = ensureAudio();
    audio.preview.gain.value = 0; // silent while rendering, still captured
    const stream = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...audio.dest.stream.getAudioTracks()
    ]);
    const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10000000 });
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      if (!rec.cancelled) {
        const url = URL.createObjectURL(new Blob(chunks, { type: mimeType || 'video/webm' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `censored_video.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      finishExport();
    };
    recorderRef.current = rec;
    exportingRef.current = true;
    setIsExporting(true);
    rec.start(1000);
    video.play().catch((err) => {
      setModelStatus(`Export failed: ${err.message}`);
      cancelExport();
    });
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${Math.floor(secs % 60).toString().padStart(2, '0')}`;

  const full = target === 'full';
  const slider = 'w-full accent-blue-500 disabled:opacity-50';
  const selectCls = 'w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500';

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
            <input id="video-input" type="file" accept="video/*" onChange={handleFileUpload} disabled={isExporting}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer disabled:opacity-50" />
          </div>
          <div className="h-px bg-neutral-800"></div>

          <div>
            <label className="block text-sm mb-2 text-neutral-300 font-semibold">Censor</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={isExporting} className={selectCls}>
              <option value="full">Whole video</option>
              <option value="background">Background only</option>
              <option value="human">Person only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-neutral-300 font-semibold">Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} disabled={isExporting} className={selectCls}>
              <option value="pixelate">Pixelate</option>
              <option value="blur">Blur</option>
              <option value="black">Solid black</option>
            </select>
          </div>
          {style !== 'black' && (
            <Row label={style === 'blur' ? 'Blur Strength' : 'Pixel Block Size'} value={`${pixelSize}px`}>
              <input type="range" min="2" max="100" value={pixelSize} onChange={(e) => setPixelSize(Number(e.target.value))} disabled={isExporting} className={slider} />
            </Row>
          )}

          {!full && (
            <>
              <div className="h-px bg-neutral-800"></div>
              <div>
                <label className="block text-sm mb-2 text-neutral-300 font-semibold">Segmentation Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} disabled={isExporting} className={selectCls}>
                  {Object.entries(MODELS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
              <Row label="Low-light Enhance" value={enhance.toFixed(2)} hint="Local contrast boost (CLAHE) applied only to what the model sees. Raise for dark / flat footage.">
                <input type="range" min="0" max="1" step="0.05" value={enhance} onChange={(e) => setEnhance(Number(e.target.value))} disabled={isExporting} className={slider} />
              </Row>
              <Row label="Detection Sensitivity" value={(1 - threshold).toFixed(2)} hint="Higher = catches fainter / partial people (more false positives).">
                <input type="range" min="0.05" max="0.95" step="0.05" value={1 - threshold} onChange={(e) => setThreshold(1 - Number(e.target.value))} disabled={isExporting} className={slider} />
              </Row>
              <Row label="Temporal Smoothing" value={smoothing.toFixed(2)}>
                <input type="range" min="0" max="0.9" step="0.05" value={smoothing} onChange={(e) => setSmoothing(Number(e.target.value))} disabled={isExporting} className={slider} />
              </Row>
              <Row label="Mask Expand/Shrink" value={`${offset > 0 ? '+' : ''}${offset}px`} hint="Expands or shrinks the censored area.">
                <input type="range" min="-30" max="60" value={offset} onChange={(e) => setOffset(Number(e.target.value))} disabled={isExporting} className={slider} />
              </Row>
              <Row label="Edge Feather" value={`${feather}px`}>
                <input type="range" min="0" max="80" value={feather} onChange={(e) => setFeather(Number(e.target.value))} disabled={isExporting} className={slider} />
              </Row>
              <div>
                <label className="block text-sm mb-2 text-neutral-300 font-semibold">Preview</label>
                <select value={view} onChange={(e) => setView(e.target.value)} disabled={isExporting} className={selectCls}>
                  <option value="result">Result</option>
                  <option value="mask">Show mask (debug)</option>
                  <option value="input">Show enhanced model input (debug)</option>
                </select>
              </div>
            </>
          )}

          <div className="h-px bg-neutral-800"></div>
          <div>
            <label className="block text-sm mb-2 text-neutral-300 font-semibold">Working Resolution</label>
            <select value={maxRes} onChange={(e) => setMaxRes(Number(e.target.value))} disabled={isExporting} className={selectCls}>
              <option value={540}>540p (fastest)</option>
              <option value={720}>720p</option>
              <option value={1080}>1080p</option>
              <option value={2160}>4K (slow)</option>
            </select>
            <p className="text-[10px] text-neutral-500 mt-1 leading-tight">Also the export resolution. Export records in real time with audio, keep this tab visible.</p>
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
          <canvas ref={canvasRef} id="output-canvas" className="max-w-full max-h-[75vh]" style={{ objectFit: 'contain' }}></canvas>
          <video ref={videoRef} id="source-video" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} playsInline
            onLoadedData={onLoadedData}
            onCanPlay={() => { if (videoRef.current.paused && gfxRef.current) renderFrame(true); }}
            onPlay={() => { setIsPlaying(true); startLoop(); }}
            onPause={() => { setIsPlaying(false); stopLoop(); }}
            onSeeked={() => { if (videoRef.current.paused) renderFrame(true); }}
            onEnded={onEnded}></video>
          {!loaded && <div id="empty-state" className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">Upload a video to begin</div>}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <span className="text-xs text-neutral-400 w-12 text-right tabular-nums">{formatTime(time.current)}</span>
            <input id="timeline" type="range" min="0" max={time.duration || 100} step="0.01" value={time.current} onChange={handleSeek} disabled={isExporting || !loaded} className="flex-grow accent-blue-500 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
            <span className="text-xs text-neutral-400 w-12 tabular-nums">{formatTime(time.duration)}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <button id="play-button" onClick={togglePlay} disabled={isExporting || !loaded} className="px-8 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500">{isPlaying ? 'Pause' : 'Play'}</button>
            {isExporting ? (
              <button id="cancel-button" onClick={cancelExport} className="px-8 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold">Cancel Render</button>
            ) : (
              <button id="render-button" onClick={startExport} disabled={!loaded || isPlaying} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400">Render to File</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
