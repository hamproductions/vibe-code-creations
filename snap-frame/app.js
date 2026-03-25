const { useState, useRef, useEffect, useCallback } = React;

// --- Embedded Lucide Icons ---
const Play = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const Pause = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="4" height="16" x="6" y="4" rx="1"/><rect width="4" height="16" x="14" y="4" rx="1"/></svg>
);
const Download = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const ChevronLeft = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRight = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
const Upload = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const Settings = ({ size = 16, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const Maximize2 = ({ size = 18, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
);
const X = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const ChevronsLeft = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
);
const ChevronsRight = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/></svg>
);
const Rewind = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>
);
const FastForward = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
);

function App() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [fps, setFps] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stripFrames, setStripFrames] = useState([]);
  const [isGeneratingStrip, setIsGeneratingStrip] = useState(false);

  // Lightbox State
  const [lightboxFrame, setLightboxFrame] = useState(null);
  const [lbScale, setLbScale] = useState(1);
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 });
  const [lbDragging, setLbDragging] = useState(false);

  const mainVideoRef = useRef(null);
  const stripVideoRef = useRef(null);
  const stripGenerationId = useRef(0);
  const centerFrameRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setStripFrames([]);
      setCurrentTime(0);

      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      if ('requestVideoFrameCallback' in tempVideo) {
        let frames = 0;
        let start = 0;
        const callback = (now) => {
          if (frames === 0) start = now;
          frames++;
          if (frames < 10) {
            tempVideo.requestVideoFrameCallback(callback);
          } else {
            const estFps = Math.round(1000 / ((now - start) / 9));
            if (estFps > 0 && estFps <= 240) setFps(estFps);
            tempVideo.pause();
            tempVideo.removeAttribute('src');
            tempVideo.load();
          }
        };
        tempVideo.play().then(() => {
          tempVideo.requestVideoFrameCallback(callback);
        }).catch(() => {});
      }
    }
  };

  const generateStrip = useCallback(async (baseTime) => {
    if (!stripVideoRef.current || isPlaying) return;

    const currentId = ++stripGenerationId.current;
    setIsGeneratingStrip(true);

    const video = stripVideoRef.current;
    const step = 1 / fps;
    const frames = [];

    const canvas = document.createElement('canvas');
    // Extract larger frame for lightbox high-res preview
    const thumbWidth = 1280;
    const thumbHeight = (thumbWidth / video.videoWidth) * video.videoHeight || 720;
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    const ctx = canvas.getContext('2d');

    for (let i = -10; i <= 10; i++) {
      if (currentId !== stripGenerationId.current) return;

      const targetTime = Math.max(0, Math.min(video.duration || 0, baseTime + (i * step)));
      video.currentTime = targetTime;

      await new Promise((resolve) => {
        const handler = () => {
          video.removeEventListener('seeked', handler);
          resolve();
        };
        video.addEventListener('seeked', handler);
        setTimeout(() => {
          video.removeEventListener('seeked', handler);
          resolve();
        }, 200);
      });

      if (currentId !== stripGenerationId.current) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({
        time: targetTime,
        offset: i,
        dataUrl: canvas.toDataURL('image/jpeg', 0.8)
      });
    }

    if (currentId === stripGenerationId.current) {
      setStripFrames(frames);
      setIsGeneratingStrip(false);
    }
  }, [fps, isPlaying]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPlaying && videoUrl) {
        generateStrip(currentTime);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentTime, isPlaying, videoUrl, generateStrip]);

  useEffect(() => {
    if (!isGeneratingStrip && centerFrameRef.current) {
      centerFrameRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [stripFrames, isGeneratingStrip]);

  const togglePlay = () => {
    if (mainVideoRef.current) {
      if (isPlaying) {
        mainVideoRef.current.pause();
      } else {
        mainVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mainVideoRef.current && isPlaying) {
      setCurrentTime(mainVideoRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (mainVideoRef.current) {
      mainVideoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpTime = (delta) => {
    if (mainVideoRef.current) {
      mainVideoRef.current.pause();
      setIsPlaying(false);
      const newTime = Math.max(0, Math.min(duration, currentTime + delta));
      mainVideoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || lightboxFrame) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpTime(-1 / fps);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpTime(1 / fps);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, currentTime, fps, videoUrl, lightboxFrame]);

  const extractOriginalFrame = (time) => {
    if (!mainVideoRef.current) return;
    const video = mainVideoRef.current;

    // Temporarily seek to exact requested time to guarantee original frame data
    const prevTime = video.currentTime;
    video.currentTime = time;

    const handler = () => {
      video.removeEventListener('seeked', handler);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frame_${time.toFixed(3)}s.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        video.currentTime = prevTime; // Restore timeline
      }, 'image/png', 1.0);
    };
    video.addEventListener('seeked', handler);
  };

  // Lightbox Interaction Handlers
  const openLightbox = (frameDataUrl, e) => {
    e.stopPropagation();
    setLightboxFrame(frameDataUrl);
    setLbScale(1);
    setLbPan({ x: 0, y: 0 });
  };

  const handleLbWheel = (e) => {
    e.preventDefault();
    setLbScale(s => Math.max(0.2, Math.min(10, s - e.deltaY * 0.005)));
  };

  const handleLbPointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    setLbDragging(true);
  };

  const handleLbPointerMove = (e) => {
    if (lbDragging) {
      setLbPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
  };

  const handleLbPointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    setLbDragging(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6">

        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium">
              <Upload size={18} />
              <span>Load Media</span>
              <input type="file" accept="video/*, image/gif" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="flex items-center gap-3 mt-4 sm:mt-0 bg-gray-950 p-2 rounded-lg border border-gray-800">
            <Settings size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400 font-mono">Detected FPS:</span>
            <input
              type="number"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value) || 30)}
              className="w-16 bg-gray-800 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              min="1"
              max="240"
            />
          </div>
        </div>

        {/* Main Video Area */}
        {videoUrl ? (
          <div className="flex flex-col items-center space-y-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg w-full">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border border-gray-800">
              <video
                ref={mainVideoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />
              <video ref={stripVideoRef} src={videoUrl} className="hidden" playsInline muted />
            </div>

            {/* Rough Timeline */}
            <div className="w-full max-w-4xl flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-white flex-shrink-0">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step="any"
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-sm font-mono text-gray-400 w-24 text-right flex-shrink-0">
                  {currentTime.toFixed(3)}s
                </span>
              </div>

              {/* Time Jump Controls */}
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 bg-gray-950/50 p-2 rounded-lg border border-gray-800">
                <button onClick={() => jumpTime(-10)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors flex items-center gap-1"><Rewind size={14}/> 10s</button>
                <button onClick={() => jumpTime(-5)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors flex items-center gap-1"><ChevronsLeft size={14}/> 5s</button>
                <button onClick={() => jumpTime(-1)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors flex items-center gap-1"><ChevronLeft size={14}/> 1s</button>
                <div className="w-px h-6 bg-gray-700 mx-2"></div>
                <button onClick={() => jumpTime(1)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors flex items-center gap-1">1s <ChevronRight size={14}/></button>
                <button onClick={() => jumpTime(5)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors flex items-center gap-1">5s <ChevronsRight size={14}/></button>
                <button onClick={() => jumpTime(10)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors flex items-center gap-1">10s <FastForward size={14}/></button>
              </div>

              {/* Fine Frame Controls */}
              <div className="flex justify-center items-center gap-4 sm:gap-6 mt-2">
                <button onClick={() => jumpTime(-1 / fps)} className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-mono text-sm border border-gray-700">
                  <ChevronLeft size={16} /> -1F
                </button>

                <button
                  onClick={() => extractOriginalFrame(currentTime)}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 border border-emerald-500/50"
                >
                  <Download size={18} />
                  Save Exact Frame
                </button>

                <button onClick={() => jumpTime(1 / fps)} className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-mono text-sm border border-gray-700">
                  +1F <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-500 bg-gray-900/50">
            Select a file to begin frame extraction.
          </div>
        )}

        {/* Frame Strip */}
        {videoUrl && (
          <div className="w-full bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg relative min-h-[160px]">
            <div className="text-xs text-gray-500 font-mono mb-3 flex justify-between px-2">
              <span>-10 Frames</span>
              <span className="text-blue-400 font-semibold">Current Center: {currentTime.toFixed(3)}s</span>
              <span>+10 Frames</span>
            </div>

            {isGeneratingStrip && (
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
                <span className="text-blue-400 font-mono text-sm animate-pulse">Generating frame map...</span>
              </div>
            )}

            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar items-center px-[50%] snap-x snap-mandatory">
              {stripFrames.map((frame) => {
                const isCenter = frame.offset === 0;
                return (
                  <div
                    key={frame.offset}
                    ref={isCenter ? centerFrameRef : null}
                    onClick={() => jumpTime(frame.time - currentTime)}
                    className={`group relative flex-shrink-0 cursor-pointer snap-center transition-all duration-300 ${
                      isCenter ? 'ring-2 ring-blue-500 scale-105 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'opacity-60 hover:opacity-100 hover:scale-95'
                    }`}
                  >
                    <img
                      src={frame.dataUrl}
                      alt={`Frame offset ${frame.offset}`}
                      className="h-28 sm:h-36 object-contain bg-black rounded"
                    />

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => openLightbox(frame.dataUrl, e)}
                        className="p-2 bg-gray-800/90 hover:bg-gray-700 rounded-full text-white backdrop-blur-sm transition-transform hover:scale-110"
                        title="Lightbox Preview"
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>

                    <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">
                      {frame.offset > 0 ? '+' : ''}{frame.offset}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxFrame && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden">
          <button
            onClick={() => setLightboxFrame(null)}
            className="absolute top-6 right-6 z-[60] p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors shadow-xl"
          >
            <X size={24} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700 text-sm font-mono text-gray-300 flex gap-4 pointer-events-none shadow-xl">
            <span>Scroll: Zoom ({Math.round(lbScale * 100)}%)</span>
            <span>Drag: Pan</span>
          </div>

          <div
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
            onWheel={handleLbWheel}
            onPointerDown={handleLbPointerDown}
            onPointerMove={handleLbPointerMove}
            onPointerUp={handleLbPointerUp}
            onPointerCancel={handleLbPointerUp}
          >
            <img
              src={lightboxFrame}
              alt="Lightbox Preview"
              className="max-w-none origin-center select-none"
              style={{
                transform: `translate(${lbPan.x}px, ${lbPan.y}px) scale(${lbScale})`,
                transition: lbDragging ? 'none' : 'transform 0.1s ease-out'
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
