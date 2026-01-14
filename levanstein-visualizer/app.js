const { useState, useEffect, useMemo, useRef } = React;

// --- Icons ---

const Play = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const Pause = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);
const SkipBack = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
);
const SkipForward = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
);
const RefreshCw = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
);
const ArrowLeft = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const ArrowUp = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
);
const ArrowUpLeft = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="17" y1="17" x2="7" y2="7"></line><polyline points="7 17 7 7 17 7"></polyline></svg>
);
const ChevronRight = ({size=16, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);


// --- Types & Logic ---

const calculateLevenshtein = (source, target) => {
  const n = source.length;
  const m = target.length;
  // Rows = Target (0..m), Cols = Source (0..n)
  const dp = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => ({ val: 0, path: false }))
  );
  const steps = [];

  // Initialization
  for (let j = 0; j <= n; j++) dp[0][j].val = j;
  for (let i = 0; i <= m; i++) dp[i][0].val = i;

  // Fill Matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const srcChar = source[j - 1];
      const tgtChar = target[i - 1];
      const cost = srcChar === tgtChar ? 0 : 1;

      const insertCost = dp[i - 1][j].val + 1;
      const deleteCost = dp[i][j - 1].val + 1;
      const subCost = dp[i - 1][j - 1].val + cost;

      const min = Math.min(insertCost, deleteCost, subCost);
      dp[i][j].val = min;

      let op = 'substitute';
      if (min === subCost) op = cost === 0 ? 'match' : 'substitute';
      else if (min === deleteCost) op = 'delete';
      else if (min === insertCost) op = 'insert';

      steps.push({
        row: i,
        col: j,
        val: min,
        candidates: { top: insertCost, left: deleteCost, diag: subCost },
        chars: { src: srcChar, tgt: tgtChar },
        substrings: {
            src: source.slice(0, j),
            tgt: target.slice(0, i)
        },
        choice: op
      });
    }
  }

  // Traceback
  let i = m, j = n;
  dp[i][j].path = true;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
        const current = dp[i][j].val;
        const cost = source[j-1] === target[i-1] ? 0 : 1;
        if (current === dp[i-1][j-1].val + cost) {
            i--; j--;
        } else if (current === dp[i][j-1].val + 1) {
            j--;
        } else {
            i--;
        }
    } else if (i > 0) i--;
    else j--;
    dp[i][j].path = true;
  }

  return { matrix: dp, steps };
};

// --- Components ---

function LevenshteinApp() {
  const [source, setSource] = useState('KITTEN');
  const [target, setTarget] = useState('SITTING');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  const { matrix: finalMatrix, steps } = useMemo(() => calculateLevenshtein(source, target), [source, target]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, steps.length]);

  useEffect(() => {
    setCurrentStepIndex(-1);
    setIsPlaying(false);
  }, [source, target]);

  const handleStepChange = (val) => {
    setIsPlaying(false);
    setCurrentStepIndex(val);
  };

  const isFinished = currentStepIndex >= 0 && currentStepIndex === steps.length - 1;
  // Safety check: Ensure currentStepIndex is within bounds of the *current* steps array
  const safeStepIndex = Math.min(currentStepIndex, steps.length - 1);
  const currentStep = safeStepIndex >= 0 ? steps[safeStepIndex] : null;

  // Compute grid display state
  const gridState = useMemo(() => {
    const grid = Array.from({ length: target.length + 1 }, (_, r) =>
      Array.from({ length: source.length + 1 }, (_, c) => ({
        val: null,
        status: 'empty',
        op: null
      }))
    );

    // Initial borders
    for(let r=0; r<=target.length; r++) { grid[r][0].val = r; grid[r][0].status = 'filled'; }
    for(let c=0; c<=source.length; c++) { grid[0][c].val = c; grid[0][c].status = 'filled'; }

    // Fill steps
    // Prevent index out of bounds if steps array shrunk since last render
    const limit = Math.min(currentStepIndex, steps.length - 1);

    for (let k = 0; k <= limit; k++) {
      const s = steps[k];
      if (s) {
        grid[s.row][s.col].val = s.val;
        grid[s.row][s.col].status = 'filled';
        grid[s.row][s.col].op = s.choice;
      }
    }

    if (currentStep) {
        grid[currentStep.row][currentStep.col].status = 'active';
    }

    if (isFinished) {
      for(let r=0; r<=target.length; r++) {
        for(let c=0; c<=source.length; c++) {
          if (finalMatrix[r][c].path) grid[r][c].status = 'path';
        }
      }
    }
    return grid;
  }, [source.length, target.length, steps, currentStepIndex, isFinished, finalMatrix, currentStep]);

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-200 font-sans overflow-hidden">
      {/* Controls Header */}
      <div className="flex-none p-4 bg-neutral-800 border-b border-neutral-700 shadow-md z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Source (j)</label>
              <input
                value={source}
                onChange={e => setSource(e.target.value.toUpperCase())}
                className="bg-neutral-900 border border-neutral-600 rounded px-3 py-1 font-mono tracking-widest text-lg focus:ring-2 focus:ring-blue-500 outline-none w-32 text-center"
              />
            </div>
            <span className="text-neutral-500">to</span>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Target (i)</label>
              <input
                value={target}
                onChange={e => setTarget(e.target.value.toUpperCase())}
                className="bg-neutral-900 border border-neutral-600 rounded px-3 py-1 font-mono tracking-widest text-lg focus:ring-2 focus:ring-purple-500 outline-none w-32 text-center"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-lg border border-neutral-700">
            <button onClick={() => setCurrentStepIndex(-1)} className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white" title="Reset"><RefreshCw size={16} /></button>
            <button onClick={() => handleStepChange(currentStepIndex - 1)} disabled={currentStepIndex < 0} className="p-2 hover:bg-neutral-800 rounded disabled:opacity-30"><SkipBack size={16} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded w-20 flex justify-center items-center gap-2 font-medium text-sm ${isPlaying ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => handleStepChange(currentStepIndex + 1)} disabled={isFinished} className="p-2 hover:bg-neutral-800 rounded disabled:opacity-30"><SkipForward size={16} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-neutral-950/50">
          <div className="relative inline-block">
            {/* Column Headers (Source) */}
            <div className="flex ml-12 mb-2">
              <div className="w-12 h-8 flex items-center justify-center font-mono text-neutral-500 text-xs">ε</div>
              {source.split('').map((char, idx) => (
                <div key={idx} className={`w-12 h-8 flex flex-col items-center justify-center font-mono font-bold transition-all duration-300 ${currentStep && currentStep.col === idx + 1 ? 'text-blue-400 scale-125 translate-y-1' : 'text-neutral-500'}`}>
                  <span>{char}</span>
                  {currentStep && currentStep.col === idx + 1 && <span className="text-[10px] text-blue-500/80 font-normal">j={idx+1}</span>}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* Row Headers (Target) */}
              <div className="flex flex-col mr-2">
                <div className="w-8 h-12 flex items-center justify-center font-mono text-neutral-500 text-xs">ε</div>
                {target.split('').map((char, idx) => (
                  <div key={idx} className={`w-8 h-12 flex items-center justify-center gap-1 font-mono font-bold transition-all duration-300 ${currentStep && currentStep.row === idx + 1 ? 'text-purple-400 scale-125 translate-x-1' : 'text-neutral-500'}`}>
                     {currentStep && currentStep.row === idx + 1 && <span className="text-[10px] text-purple-500/80 font-normal [writing-mode:vertical-rl] rotate-180">i={idx+1}</span>}
                    {char}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${source.length + 1}, min-content)` }}>
                {gridState.map((row, rIdx) => (
                  row.map((cell, cIdx) => (
                    <div key={`${rIdx}-${cIdx}`} className={`w-12 h-12 flex items-center justify-center border rounded transition-all duration-200 relative
                      ${cell.status === 'path' ? 'bg-green-900/40 text-green-400 font-bold border-green-800/50' :
                        cell.status === 'active' ? 'bg-white text-black font-bold border-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.3)]' :
                        cell.status === 'filled' ? 'bg-neutral-800 text-neutral-300 border-neutral-700' :
                        'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                      {cell.val !== null ? cell.val : ''}
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[400px] bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-xl z-20 overflow-y-auto">
          {/* Section 1: I & J Intuition */}
          <div className="p-6 border-b border-neutral-800 bg-neutral-800/30">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Cursor State (Substrings)
            </h2>
            {currentStep ? (
                <div className="space-y-3 font-mono text-sm bg-neutral-900 p-4 rounded border border-neutral-700">
                    <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-xs uppercase">Old Word (0..j)</span>
                        <span className="text-blue-400 font-bold">j={currentStep.col}</span>
                    </div>
                    <div className="text-lg tracking-widest">
                        <span className="text-blue-400 font-bold border-b-2 border-blue-500">{currentStep.substrings.src}</span>
                        <span className="text-neutral-700">{source.slice(currentStep.col)}</span>
                    </div>

                    <div className="flex justify-center py-1">
                        <ArrowUp size={14} className="text-neutral-600" />
                        <span className="text-xs text-neutral-600 px-2 italic">transforming into</span>
                        <ArrowUp size={14} className="text-neutral-600" />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-xs uppercase">New Word (0..i)</span>
                        <span className="text-purple-400 font-bold">i={currentStep.row}</span>
                    </div>
                    <div className="text-lg tracking-widest">
                        <span className="text-purple-400 font-bold border-b-2 border-purple-500">{currentStep.substrings.tgt}</span>
                        <span className="text-neutral-700 opacity-30">{target.slice(currentStep.row)}</span>
                    </div>
                </div>
            ) : (
                <div className="text-neutral-500 text-sm italic">Press Play to track substrings.</div>
            )}
          </div>

          {/* Section 2: Recurrence Relation */}
          <div className="p-6 border-b border-neutral-800">
             <h3 className="text-xs font-bold text-neutral-400 uppercase mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Recurrence Logic
             </h3>
             <div className="font-mono text-xs bg-neutral-950 p-4 rounded border border-neutral-800 space-y-3">
               <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-2">
                 <span className="text-neutral-400">D[i, j] = MIN(</span>
                 <span className="text-white font-bold">{currentStep ? currentStep.val : '?'}</span>
               </div>

               {/* Deletion Line */}
               <div className={`flex justify-between items-center p-1.5 rounded transition-colors duration-300 ${currentStep?.choice === 'delete' ? 'bg-blue-900/30 text-blue-200 border border-blue-500/30' : 'text-neutral-500'}`}>
                 <span>D[i, j-1] + 1</span>
                 <span className="text-[10px] uppercase tracking-wider opacity-70">Delete</span>
               </div>

               {/* Insertion Line */}
               <div className={`flex justify-between items-center p-1.5 rounded transition-colors duration-300 ${currentStep?.choice === 'insert' ? 'bg-purple-900/30 text-purple-200 border border-purple-500/30' : 'text-neutral-500'}`}>
                 <span>D[i-1, j] + 1</span>
                 <span className="text-[10px] uppercase tracking-wider opacity-70">Insert</span>
               </div>

               {/* Substitution Line */}
               <div className={`flex justify-between items-center p-1.5 rounded transition-colors duration-300 ${(currentStep?.choice === 'match' || currentStep?.choice === 'substitute') ? 'bg-green-900/30 text-green-200 border border-green-500/30' : 'text-neutral-500'}`}>
                 <span>D[i-1, j-1] + cost</span>
                 <span className="text-[10px] uppercase tracking-wider opacity-70">Sub/Match</span>
               </div>

               <div className="text-right text-neutral-500 pt-1">)</div>
             </div>
          </div>

          {/* Section 3: Calculation Details */}
          <div className="p-6 flex-1 bg-neutral-900/50">
            <h3 className="text-xs font-bold text-neutral-400 uppercase mb-3">Calculation</h3>
            {currentStep ? (
                 <div className="space-y-4">
                  <div className="text-sm font-mono flex items-center gap-2 mb-4">
                    <span className="text-neutral-500">Comparing:</span>
                    <span className={`font-bold px-2 py-1 rounded ${currentStep.chars.src === currentStep.chars.tgt ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'}`}>
                        '{currentStep.chars.src}' vs '{currentStep.chars.tgt}'
                    </span>
                    <span className="text-neutral-500 ml-auto">Cost: {currentStep.chars.src === currentStep.chars.tgt ? 0 : 1}</span>
                  </div>

                  <div className="space-y-2">
                    <CandidateDetail
                        label="Top (Insert)"
                        val={currentStep.candidates.top}
                        isChosen={currentStep.choice === 'insert'}
                        icon={<ArrowUp size={14}/>}
                    />
                    <CandidateDetail
                        label="Left (Delete)"
                        val={currentStep.candidates.left}
                        isChosen={currentStep.choice === 'delete'}
                        icon={<ArrowLeft size={14}/>}
                    />
                    <CandidateDetail
                        label="Diag (Sub/Match)"
                        val={currentStep.candidates.diag}
                        isChosen={currentStep.choice === 'match' || currentStep.choice === 'substitute'}
                        icon={<ArrowUpLeft size={14}/>}
                    />
                  </div>
                 </div>
            ) : (
                <div className="text-center text-neutral-600 mt-10">Waiting to start...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CandidateDetail = ({ label, val, isChosen, icon }) => (
    <div className={`flex items-center justify-between p-2 rounded border ${isChosen ? 'bg-white/10 border-white/30 text-white shadow-sm' : 'border-transparent text-neutral-600'}`}>
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-bold uppercase">{label}</span>
        </div>
        <span className="font-mono">{val}</span>
    </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LevenshteinApp />);
