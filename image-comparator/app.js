const { useState, useRef, useEffect } = React;

// --- Embedded Icons to prevent external script errors ---
const UploadIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const SettingsIcon = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const LayersIcon = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
const SplitSquareHorizontalIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>
);
const SplitSquareVerticalIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" x2="21" y1="12" y2="12"/></svg>
);
const BlendIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><circle cx="15" cy="15" r="7"/></svg>
);
const TimerIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>
);
const ColumnsIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="18" x="3" y="3" rx="1"/><rect width="7" height="18" x="14" y="3" rx="1"/></svg>
);
const MoveIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>
);
const RotateCcwIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);
const CopyIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const LockIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const UnlockIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V5a5 5 0 0 1 9.9-1"/></svg>
);
const MaximizeIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);

const FIT_CLASSES = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill'
};

const ALIGN_CLASSES = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom'
};

function App() {
  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  const [mode, setMode] = useState('split-h'); // split-h, split-v, opacity, difference, blink, side-by-side
  const [fitMode, setFitMode] = useState('contain'); // contain, cover, fill
  const [alignment, setAlignment] = useState('center'); // top, center, bottom
  const [isTransformMode, setIsTransformMode] = useState(false);
  const [transformTarget, setTransformTarget] = useState('B');
  const [transformA, setTransformA] = useState({ scale: 1, x: 0, y: 0 });
  const [transformB, setTransformB] = useState({ scale: 1, x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [dimsA, setDimsA] = useState({ w: 0, h: 0 });
  const [dimsB, setDimsB] = useState({ w: 0, h: 0 });
  const [value, setValue] = useState(50);
  const [blinkSpeed, setBlinkSpeed] = useState(500);
  const [showA, setShowA] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleImageUpload = (e, setImage, currentImage) => {
    const file = e.target.files[0];
    if (file) {
      if (currentImage) URL.revokeObjectURL(currentImage);
      setImage(URL.createObjectURL(file));
    }
  };

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    if (isTransformMode) {
      if (isLocked) {
        const move = { x: e.movementX, y: e.movementY };
        setTransformA(prev => ({ ...prev, x: prev.x + move.x, y: prev.y + move.y }));
        setTransformB(prev => ({ ...prev, x: prev.x + move.x, y: prev.y + move.y }));
      } else {
        const setter = transformTarget === 'A' ? setTransformA : setTransformB;
        setter(prev => ({
          ...prev,
          x: prev.x + e.movementX,
          y: prev.y + e.movementY
        }));
      }
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    if (mode === 'split-h') {
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setValue((x / rect.width) * 100);
    } else if (mode === 'split-v') {
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      setValue((y / rect.height) * 100);
    }
  };

  const handleWheel = (e) => {
    if (!isTransformMode) return;
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;

    if (isLocked) {
      setTransformA(prev => ({ ...prev, scale: Math.max(0.1, Math.min(10, prev.scale * factor)) }));
      setTransformB(prev => ({ ...prev, scale: Math.max(0.1, Math.min(10, prev.scale * factor)) }));
    } else {
      const setter = transformTarget === 'A' ? setTransformA : setTransformB;
      setter(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(10, prev.scale * factor))
      }));
    }
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageA) URL.revokeObjectURL(imageA);
    };
  }, [imageA]);

  useEffect(() => {
    return () => {
      if (imageB) URL.revokeObjectURL(imageB);
    };
  }, [imageB]);

  useEffect(() => {
    let interval;
    if (mode === 'blink') {
      interval = setInterval(() => {
        setShowA(prev => !prev);
      }, blinkSpeed);
    } else {
      setShowA(true);
    }
    return () => clearInterval(interval);
  }, [mode, blinkSpeed]);

  const renderComparison = () => {
    if (!imageA || !imageB) return null;

    const styleA = {
      transform: `translate(${transformA.x}px, ${transformA.y}px) scale(${transformA.scale})`,
      transformOrigin: 'center center'
    };
    const styleB = {
      transform: `translate(${transformB.x}px, ${transformB.y}px) scale(${transformB.scale})`,
      transformOrigin: 'center center'
    };

    const baseImageClass = `absolute inset-0 w-full h-full ${FIT_CLASSES[fitMode]} ${ALIGN_CLASSES[alignment]} pointer-events-none select-none`;

    let comparisonContent;

    if (mode === 'side-by-side') {
      comparisonContent = (
        <div className="flex w-full h-full bg-black overflow-hidden pointer-events-none">
          <div className="w-1/2 h-full border-r border-neutral-800 relative">
            <img src={imageA} alt="Base" className={`absolute inset-0 w-full h-full ${FIT_CLASSES[fitMode]} ${ALIGN_CLASSES[alignment]} select-none`} style={styleA} />
          </div>
          <div className="w-1/2 h-full relative">
            <img src={imageB} alt="Overlay" className={`absolute inset-0 w-full h-full ${FIT_CLASSES[fitMode]} ${ALIGN_CLASSES[alignment]} select-none`} style={styleB} />
          </div>
        </div>
      );
    } else {
      let imageBStyle = { ...styleB };
      let overlay = null;

      switch (mode) {
        case 'split-h':
          imageBStyle.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
          overlay = (
            <div
              className={`absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_5px_rgba(0,0,0,0.5)] z-10 ${isTransformMode ? 'pointer-events-none' : 'cursor-col-resize'}`}
              style={{ left: `calc(${value}% - 2px)` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-white rounded shadow-md flex items-center justify-center">
                <div className="w-0.5 h-4 bg-gray-400 mx-0.5"></div>
                <div className="w-0.5 h-4 bg-gray-400 mx-0.5"></div>
              </div>
            </div>
          );
          break;
        case 'split-v':
          imageBStyle.clipPath = `polygon(0 0, 100% 0, 100% ${value}%, 0 ${value}%)`;
          overlay = (
            <div
              className={`absolute left-0 right-0 h-1 bg-white shadow-[0_0_5px_rgba(0,0,0,0.5)] z-10 ${isTransformMode ? 'pointer-events-none' : 'cursor-row-resize'}`}
              style={{ top: `calc(${value}% - 2px)` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-8 bg-white rounded shadow-md flex flex-col items-center justify-center">
                <div className="h-0.5 w-4 bg-gray-400 my-0.5"></div>
                <div className="h-0.5 w-4 bg-gray-400 my-0.5"></div>
              </div>
            </div>
          );
          break;
        case 'opacity':
          imageBStyle.opacity = value / 100;
          break;
        case 'difference':
          imageBStyle.mixBlendMode = 'difference';
          break;
        case 'blink':
          imageBStyle.opacity = showA ? 0 : 1;
          break;
      }

      comparisonContent = (
        <>
          <img
            src={imageA} alt="Base"
            className={baseImageClass} style={styleA}
            onLoad={(e) => setDimsA({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          />
          <img
            src={imageB} alt="Overlay"
            className={baseImageClass} style={imageBStyle}
            onLoad={(e) => setDimsB({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          />
          {overlay}
        </>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full bg-black overflow-hidden
          ${isTransformMode ? 'cursor-move' : (mode.startsWith('split') ? (mode === 'split-h' ? 'cursor-col-resize' : 'cursor-row-resize') : '')}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
      >
        {comparisonContent}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-100 font-sans">
      <header className="flex flex-wrap items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950 gap-4 shadow-sm">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors border border-neutral-700">
            <UploadIcon size={18} />
            <span className="text-sm font-medium">{imageA ? 'Change Image A' : 'Load Image A'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setImageA, imageA)} />
          </label>
          <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors border border-neutral-700">
            <UploadIcon size={18} />
            <span className="text-sm font-medium">{imageB ? 'Change Image B' : 'Load Image B'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setImageB, imageB)} />
          </label>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button onClick={() => setMode('side-by-side')} className={`p-2 rounded ${mode === 'side-by-side' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} title="Side by Side">
              <ColumnsIcon size={18} />
            </button>
            <button onClick={() => setMode('split-h')} className={`p-2 rounded ${mode === 'split-h' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} title="Horizontal Split">
              <SplitSquareHorizontalIcon size={18} />
            </button>
            <button onClick={() => setMode('split-v')} className={`p-2 rounded ${mode === 'split-v' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} title="Vertical Split">
              <SplitSquareVerticalIcon size={18} />
            </button>
            <button onClick={() => setMode('opacity')} className={`p-2 rounded ${mode === 'opacity' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} title="Opacity Overlay">
              <LayersIcon size={18} />
            </button>
            <button onClick={() => setMode('difference')} className={`p-2 rounded ${mode === 'difference' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} title="Difference Blend">
              <BlendIcon size={18} />
            </button>
            <button onClick={() => setMode('blink')} className={`p-2 rounded ${mode === 'blink' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} title="Blink Toggle">
              <TimerIcon size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setIsTransformMode(!isTransformMode)}
              className={`p-2 rounded flex items-center gap-2 transition-colors ${isTransformMode ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title="Manual Match Mode (Pan/Zoom Image B)"
            >
              <MoveIcon size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{isTransformMode ? 'On' : 'Off'}</span>
            </button>
            {isTransformMode && (
              <>
                <div className="flex items-center bg-neutral-800 rounded p-0.5 border border-neutral-700 mx-1">
                  <button
                    onClick={() => setTransformTarget('A')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${transformTarget === 'A' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >A</button>
                  <button
                    onClick={() => setTransformTarget('B')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${transformTarget === 'B' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >B</button>
                </div>
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  className={`p-2 rounded transition-colors ${isLocked ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                  title={isLocked ? 'Unlock Transforms' : 'Lock Transforms (Pan/Zoom Together)'}
                >
                  {isLocked ? <LockIcon size={18}/> : <UnlockIcon size={18}/>}
                </button>
                <button
                  onClick={() => {
                    if (transformTarget === 'A') setTransformA({ ...transformB });
                    else setTransformB({ ...transformA });
                  }}
                  className="p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                  title={`Match ${transformTarget} to ${transformTarget === 'A' ? 'B' : 'A'}`}
                >
                  <CopyIcon size={18} />
                </button>
                {(dimsA.w > 0 && dimsB.w > 0) && (
                  <button
                    onClick={() => {
                      const ratio = dimsA.w / dimsB.w;
                      setTransformB(prev => ({ ...prev, scale: transformA.scale * ratio }));
                    }}
                    className="p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                    title="Auto-Match Scale (Based on natural width ratio)"
                  >
                    <MaximizeIcon size={18} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (transformTarget === 'A') setTransformA({ scale: 1, x: 0, y: 0 });
                    else setTransformB({ scale: 1, x: 0, y: 0 });
                  }}
                  className="p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                  title={`Reset Image ${transformTarget} Transform`}
                >
                  <RotateCcwIcon size={18} />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SettingsIcon size={18} className="text-neutral-500" />
            <select
              value={fitMode}
              onChange={(e) => setFitMode(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="contain">Scale: Contain</option>
              <option value="cover">Scale: Cover (Crop)</option>
              <option value="fill">Scale: Fill (Stretch)</option>
            </select>
            {fitMode !== 'fill' && (
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="top">Align: Top</option>
                <option value="center">Align: Center</option>
                <option value="bottom">Align: Bottom</option>
              </select>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col">
        {!imageA || !imageB ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 m-8 rounded-xl">
            <div className="text-center">
              <LayersIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>Load two images to begin comparison.</p>
              <p className="text-sm mt-2 opacity-75">All processing happens locally in your browser.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 w-full h-full relative border-b border-neutral-800">
              {renderComparison()}
            </div>
            {(mode === 'opacity') && (
              <div className="h-16 bg-neutral-950 flex items-center justify-center px-8 gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                <span className="text-sm font-mono text-neutral-400">Image A</span>
                <input
                  type="range"
                  min="0" max="100"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full max-w-xl h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono text-neutral-400">Image B</span>
              </div>
            )}
            {(mode === 'difference') && (
              <div className="h-16 bg-neutral-950 flex items-center justify-center px-8 gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                <span className="text-sm text-neutral-400 flex items-center gap-2">
                  <BlendIcon size={16}/> Highlighting exact pixel differences $|A - B|$
                </span>
              </div>
            )}
            {(mode === 'blink') && (
              <div className="h-16 bg-neutral-950 flex items-center justify-center px-8 gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                <span className="text-sm font-mono text-neutral-400">Fast</span>
                <input
                  type="range"
                  min="50" max="1500"
                  step="50"
                  value={blinkSpeed}
                  onChange={(e) => setBlinkSpeed(Number(e.target.value))}
                  className="w-full max-w-xl h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono text-neutral-400">Slow</span>
              </div>
            )}
            {isTransformMode && (
              <div className="h-16 bg-neutral-950 flex items-center justify-center px-8 gap-4 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
                <span className="text-sm font-mono text-neutral-400">0.1x</span>
                <div className="flex-1 max-w-xl flex flex-col gap-1">
                  <input
                    type="range"
                    min="0.1" max="10"
                    step="0.01"
                    value={transformTarget === 'A' ? transformA.scale : transformB.scale}
                    onChange={(e) => {
                      const newScale = Number(e.target.value);
                      if (isLocked) {
                        setTransformA(prev => ({ ...prev, scale: newScale }));
                        setTransformB(prev => ({ ...prev, scale: newScale }));
                      } else {
                        const setter = transformTarget === 'A' ? setTransformA : setTransformB;
                        setter(prev => ({ ...prev, scale: newScale }));
                      }
                    }}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono uppercase">
                    <span>Target: {isLocked ? 'Locked (A+B)' : transformTarget}</span>
                    <span>Scale: {(transformTarget === 'A' ? transformA.scale : transformB.scale).toFixed(2)}x</span>
                  </div>
                </div>
                <span className="text-sm font-mono text-neutral-400">10x</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
