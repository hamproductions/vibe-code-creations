
const { useState, useEffect, useRef, useCallback } = React;

// --- ICONS ---
const IconWrapper = ({ size = 24, className, children }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {children}
    </svg>
);

const Play = (props) => (
    <IconWrapper {...props}>
        <polygon points="5 3 19 12 5 21 5 3" />
    </IconWrapper>
);

const RotateCcw = (props) => (
    <IconWrapper {...props}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </IconWrapper>
);

const Volume2 = (props) => (
    <IconWrapper {...props}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </IconWrapper>
);

const Settings2 = (props) => (
    <IconWrapper {...props}>
        <path d="M20 7h-9" />
        <path d="M14 17H5" />
        <circle cx="17" cy="17" r="3" />
        <circle cx="7" cy="7" r="3" />
    </IconWrapper>
);

const Check = (props) => (
    <IconWrapper {...props}>
        <polyline points="20 6 9 17 4 12" />
    </IconWrapper>
);

const X = (props) => (
    <IconWrapper {...props}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </IconWrapper>
);

const ArrowRight = (props) => (
    <IconWrapper {...props}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </IconWrapper>
);

const RefreshCcw = (props) => (
    <IconWrapper {...props}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
    </IconWrapper>
);

const Square = (props) => (
    <IconWrapper {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </IconWrapper>
);

const Music = (props) => (
    <IconWrapper {...props}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </IconWrapper>
);

const Dice5 = (props) => (
    <IconWrapper {...props}>
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <path d="M16 8h.01" />
        <path d="M8 8h.01" />
        <path d="M8 16h.01" />
        <path d="M16 16h.01" />
        <path d="M12 12h.01" />
    </IconWrapper>
);

// --- CHORD DEFINITIONS ---
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const CHORD_DATA = {
  // Diatonic
  'I':    { semitones: 0,  type: 'maj', group: 'Diatonic' },
  'ii':   { semitones: 2,  type: 'min', group: 'Diatonic' },
  'iii':  { semitones: 4,  type: 'min', group: 'Diatonic' },
  'IV':   { semitones: 5,  type: 'maj', group: 'Diatonic' },
  'V':    { semitones: 7,  type: 'maj', group: 'Diatonic' },
  'vi':   { semitones: 9,  type: 'min', group: 'Diatonic' },
  'vii°': { semitones: 11, type: 'dim', group: 'Diatonic' },

  // Secondary Dominants
  'V/V':  { semitones: 2,  type: 'dom7', group: 'Secondary' },
  'III7': { semitones: 4,  type: 'dom7', group: 'Secondary' },
  'VI7':  { semitones: 9,  type: 'dom7', group: 'Secondary' },
  'I7':   { semitones: 0,  type: 'dom7', group: 'Secondary' },

  // Borrowed / Modal Interchange
  'iv':   { semitones: 5,  type: 'min', group: 'Borrowed' },
  'bVI':  { semitones: 8,  type: 'maj', group: 'Borrowed' },
  'bVII': { semitones: 10, type: 'maj', group: 'Borrowed' },
  'bIII': { semitones: 3,  type: 'maj', group: 'Borrowed' },

  // Fancy / Substitutions
  'bII':  { semitones: 1,  type: 'maj7', group: 'Substitutions' }, // Tritone Sub
  '#i°':  { semitones: 1,  type: 'dim7', group: 'Substitutions' },
  'IVΔ7': { semitones: 5,  type: 'maj7', group: 'Extensions' },
};

const PRESETS = {
  'Pop': ['I', 'IV', 'V', 'vi'],
  'Diatonic': ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  'J-Pop': ['I', 'iii', 'III7', 'IV', 'IVΔ7', 'V', 'vi', 'bVI'],
  'Jazz': ['I', 'ii', 'V', 'vi', 'bII', 'vii°', 'III7', 'VI7'],
  'All': Object.keys(CHORD_DATA),
};

// --- VOICING LOGIC ---

const VOICINGS = {
  'maj': [
    [0, 4, 7],      // Root
    [-5, 0, 4],     // 2nd Inv (5th in bass)
    [4, 7, 12],     // 1st Inv
    [0, 7, 16]      // Spread (Open)
  ],
  'min': [
    [0, 3, 7],      // Root
    [-5, 0, 3],     // 2nd Inv
    [3, 7, 12],     // 1st Inv
    [0, 7, 15]      // Spread
  ],
  'dim': [
    [0, 3, 6],
    [3, 6, 12],
    [-6, 0, 3]
  ],
  'dom7': [
    [0, 4, 7, 10],   // Root
    [-2, 0, 4, 7],   // 3rd Inv (7th in bass)
    [4, 7, 10, 12]   // 1st Inv
  ],
  'maj7': [
    [0, 4, 7, 11],
    [0, 7, 11, 16],  // Spread
    [-1, 0, 4, 7]    // 3rd inv (7th in bass)
  ],
  'dim7': [
    [0, 3, 6, 9],
    [3, 6, 9, 12]
  ]
};

const getChordNotes = (rootNote, chordTypeStr, octave = 4, forceRootPosition = false) => {
  const rootIndex = KEYS.indexOf(rootNote);
  const data = CHORD_DATA[chordTypeStr];
  if (!data) return [];

  // 1. Determine Voicing Intervals
  let possibleVoicings = VOICINGS[data.type] || [[0, 4, 7]];

  // Use Root position for "Context" chords (forceRootPosition), otherwise random
  let intervals = forceRootPosition
    ? possibleVoicings[0]
    : possibleVoicings[Math.floor(Math.random() * possibleVoicings.length)];

  // 2. Map to Notes
  return intervals.map(interval => {
    let noteIndex = rootIndex + data.semitones + interval;
    let currentOctave = octave;

    // Normalize octave shifts from intervals (e.g., -5 semitones)
    while (noteIndex < 0) { noteIndex += 12; currentOctave -= 1; }
    while (noteIndex >= 12) { noteIndex -= 12; currentOctave += 1; }

    // Keep chords roughly centered around C4/C5 for visibility/audibility
    if (currentOctave < 2) currentOctave += 1;
    if (currentOctave > 5) currentOctave -= 1;

    return `${KEYS[noteIndex]}${currentOctave}`;
  });
};

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // App State
  const [mode, setMode] = useState('single');
  const [activePool, setActivePool] = useState(PRESETS['Pop']);
  const [keyCenter, setKeyCenter] = useState('C');

  const [targetChord, setTargetChord] = useState(null);
  const [targetSequence, setTargetSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [progressionLength] = useState(4);

  const [feedback, setFeedback] = useState(null);

  const sampler = useRef(null);

  // Initialize Sampler
  const initAudio = async () => {
    if (isLoaded) return;

    await Tone.start();
    await Tone.Transport.start();

    sampler.current = new Tone.Sampler({
      urls: {
        "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", "A1": "A1.mp3",
        "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", "A2": "A2.mp3",
        "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", "A3": "A3.mp3",
        "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", "A4": "A4.mp3",
        "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", "A5": "A5.mp3",
        "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", "A6": "A6.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        setIsLoaded(true);
        // We defer the first generation until after load to avoid empty state
      }
    }).toDestination();

    const compressor = new Tone.Compressor({ threshold: -20, ratio: 3 }).toDestination();
    sampler.current.connect(compressor);
  };

  // Trigger initial generation once loaded
  useEffect(() => {
      if (isLoaded) {
        if (mode === 'single') generateNewChord(true);
        else generateNewSequence(true);
      }
  }, [isLoaded]);

  // --- AUDIO LOGIC ---

  const stopAudio = useCallback(() => {
    if (!sampler.current) return;
    Tone.Transport.cancel();
    sampler.current.releaseAll();
    setIsPlaying(false);
  }, []);

  const playSingleChordAudio = (chord, forceRoot = false) => {
      if (!sampler.current) return;
      sampler.current.releaseAll();

      const notes = getChordNotes(keyCenter, chord, 4, forceRoot);
      // Always add a root bass note for grounding, regardless of inversion
      const rootBass = getChordNotes(keyCenter, chord, 3, true)[0];

      sampler.current.triggerAttackRelease([...notes, rootBass], '1n');
  };

  // Play Context (Just Tonic) -> Then Question
  const playContextAndQuestion = (key, content, modeType) => {
    if (!sampler.current) return;
    stopAudio();
    setIsPlaying(true);

    const now = Tone.Transport.now();

    // CONTEXT: JUST TONIC (I)
    // Establish key with a strong, root-position Tonic chord
    const I = getChordNotes(key, 'I', 4, true);
    const I_bass = getChordNotes(key, 'I', 3, true)[0];

    // Play Tonic for 1.5 seconds (slower context)
    sampler.current.triggerAttackRelease([...I, I_bass], '1n', now);

    // Question starts after context + pause (1.5 seconds later)
    const questionStart = now + 1.5;

    // PLAY QUESTION
    if (modeType === 'single') {
        Tone.Transport.schedule((time) => {
            const notes = getChordNotes(key, content, 4, false); // Random voicing
            const root = getChordNotes(key, content, 3, true)[0]; // Bass root
            // '1n' is whole note.
            sampler.current.triggerAttackRelease([...notes, root], '1n', time);
        }, questionStart);

        // Allow ring out before enabling UI again
        Tone.Transport.schedule(() => setIsPlaying(false), questionStart + 2.5);
    }
    else {
        // Progression
        const progGap = 1.5; // REDUCED GAP (was 3.0)
        const duration = '1n';

        content.forEach((chord, i) => {
            Tone.Transport.schedule((time) => {
                const notes = getChordNotes(key, chord, 4, false); // Random voicing
                const r = getChordNotes(key, chord, 3, true)[0];
                sampler.current.triggerAttackRelease([...notes, r], duration, time);
            }, questionStart + (i * progGap));
        });

         Tone.Transport.schedule(() => setIsPlaying(false), questionStart + (content.length * progGap) + 1);
    }
  };

  const playSequenceOfChords = (chords) => {
      if (!sampler.current) return;
      stopAudio();
      setIsPlaying(true);

      const duration = '1n';
      const gap = 1.5; // REDUCED GAP between chords in replay (was 3.0)
      const now = Tone.Transport.now();

      chords.forEach((chord, i) => {
          Tone.Transport.schedule((time) => {
              const notes = getChordNotes(keyCenter, chord, 4, false);
              const root = getChordNotes(keyCenter, chord, 3, true)[0];
              sampler.current.triggerAttackRelease([...notes, root], duration, time);
          }, now + (i * gap));
      });

      Tone.Transport.schedule(() => setIsPlaying(false), now + (chords.length * gap) + 1);
  };

  const playContextOnly = useCallback(() => {
    if (!sampler.current) return;
    stopAudio();
    setIsPlaying(true);

    // JUST TONIC - No cadence
    const now = Tone.Transport.now();
    const I = getChordNotes(keyCenter, 'I', 4, true);
    const I_bass = getChordNotes(keyCenter, 'I', 3, true)[0];

    sampler.current.triggerAttackRelease([...I, I_bass], '1n', now);

    Tone.Transport.schedule(() => setIsPlaying(false), now + 2.5);
  }, [keyCenter, stopAudio]);

  const replayFullTarget = () => {
    if (!sampler.current) return;

    if (mode === 'single' && targetChord) {
        // Replay with random voicing again? Or keep same?
        // Ideally same voicing for repeat, but random is fine for "hard mode"
        playSingleChordAudio(targetChord);
    }
    else if (mode === 'progression' && targetSequence.length > 0) {
        playSequenceOfChords(targetSequence);
    }
  };

  // --- GAME LOGIC ---

  const generateNewChord = (play = true) => {
    // FILTER: STRICTLY EXCLUDE 'I' FROM SINGLE MODE QUESTIONS
    const candidates = activePool.filter(c => c !== 'I');

    if (candidates.length === 0) {
        // Safety fallback if only 'I' is selected
        return;
    }

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    const newKey = KEYS[Math.floor(Math.random() * KEYS.length)];

    setKeyCenter(newKey);
    setTargetChord(next);
    setFeedback(null);

    if (play && sampler.current) {
        setTimeout(() => playContextAndQuestion(newKey, next, 'single'), 100);
    }
  };

  const generateNewSequence = (play = true) => {
      const pool = activePool.length > 0 ? activePool : ['I'];
      const newSeq = [];
      for(let i=0; i<progressionLength; i++) {
          newSeq.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      const newKey = KEYS[Math.floor(Math.random() * KEYS.length)];

      setKeyCenter(newKey);
      setTargetSequence(newSeq);
      setUserSequence([]);
      setFeedback(null);

      if (play && sampler.current) {
         setTimeout(() => playContextAndQuestion(newKey, newSeq, 'progression'), 100);
      }
  };

  const handleGuess = (chord) => {
    if (feedback === 'correct') return;
    if (feedback === 'wrong') return;

    // SINGLE MODE
    if (mode === 'single') {
        if (chord === targetChord) {
            setFeedback('correct');
            // Play correct chord for confirmation
            playSingleChordAudio(chord, true);
            setTimeout(() => generateNewChord(true), 1200);
        } else {
            // Play wrong chord for feedback
            playSingleChordAudio(chord, true);
            setFeedback('wrong');
            setTimeout(() => setFeedback(null), 500);
        }
        return;
    }

    // PROGRESSION MODE
    if (mode === 'progression') {
        const currentStep = userSequence.length;
        const expected = targetSequence[currentStep];

        if (chord === expected) {
            const newUserSeq = [...userSequence, chord];
            setUserSequence(newUserSeq);
            // Play success chord (root pos for clarity on confirmation)
            playSingleChordAudio(chord, true);

            if (newUserSeq.length === targetSequence.length) {
                setFeedback('correct');
                setTimeout(() => generateNewSequence(true), 1200);
            }
        } else {
            // Play wrong chord for feedback
            playSingleChordAudio(chord, true);
            setFeedback('wrong');
            setTimeout(() => setFeedback(null), 500);
        }
    }
  };

  const toggleChord = (chord) => {
    setActivePool(prev =>
      prev.includes(chord)
        ? prev.filter(c => c !== chord)
        : [...prev, chord]
    );
  };

  const loadPreset = (name) => setActivePool(PRESETS[name]);

  const switchMode = (newMode) => {
      stopAudio();
      setMode(newMode);
      setFeedback(null);
      setTimeout(() => {
          if (newMode === 'single') generateNewChord(true);
          else generateNewSequence(true);
      }, 50);
  };

  const groupedChords = Object.entries(CHORD_DATA).reduce((acc, [key, data]) => {
    if (!acc[data.group]) acc[data.group] = [];
    acc[data.group].push(key);
    return acc;
  }, {});

  // --- RENDERING ---

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-light mb-8">ChordVibe Pro</h1>
        <button
          onClick={initAudio}
          className="flex items-center gap-3 px-8 py-4 bg-white text-black font-medium rounded-full hover:scale-105 transition-all"
        >
           <Play size={20} /> Load Piano Samples
        </button>
        <p className="mt-4 text-neutral-500 text-sm">~5MB download required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-neutral-900 z-10">
        <div className="flex items-center gap-3">
             <div className="font-bold tracking-tight text-lg text-white">ChordVibe</div>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700">
                <Music size={12} className="text-neutral-400" />
                <span className="text-xs font-bold text-neutral-300 w-4 text-center">{keyCenter}</span>
             </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-neutral-800 rounded-full p-1 border border-neutral-700">
            <button
                onClick={() => switchMode('single')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'single' ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400'}`}
            >
                Single
            </button>
            <button
                onClick={() => switchMode('progression')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'progression' ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400'}`}
            >
                Progression
            </button>
        </div>

        <button onClick={() => setShowConfig(true)} className="p-2 hover:bg-neutral-800 rounded-full">
            <Settings2 size={24} />
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 relative">

        {/* VISUALIZER */}
        <div className="relative mb-12 w-full flex justify-center">

            {/* SINGLE MODE VISUALIZER */}
            {mode === 'single' && (
                <div className="relative">
                    <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 ${feedback === 'correct' ? 'bg-green-500/20 opacity-100' : 'bg-neutral-500/10 opacity-0'}`}></div>
                    <button
                        onClick={replayFullTarget}
                        className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-200
                        ${feedback === 'correct'
                            ? 'border-green-500 bg-neutral-800 scale-110'
                            : feedback === 'wrong'
                                ? 'border-red-500 bg-neutral-800 translate-x-1'
                                : 'border-neutral-700 bg-neutral-800 hover:border-neutral-500 active:scale-95'
                        }`}
                    >
                        {feedback === 'correct' ? (
                            <span className="text-4xl font-bold text-white">{targetChord}</span>
                        ) : (
                            <>
                                <Volume2 size={40} className={`text-neutral-400 ${isPlaying && 'animate-pulse text-white'}`} />
                                <div className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-1">
                                    <Dice5 size={10} /> Multi-Voice
                                </div>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* PROGRESSION MODE VISUALIZER */}
            {mode === 'progression' && (
                <div className="flex gap-3 justify-center items-center w-full max-w-sm">
                    {targetSequence.map((chord, idx) => {
                        const isGuessed = idx < userSequence.length;
                        const isCurrent = idx === userSequence.length;
                        let stateClass = 'border-neutral-700 bg-neutral-800 text-neutral-500';
                        if (isGuessed) stateClass = 'border-green-500 bg-neutral-800 text-white font-bold';
                        if (isCurrent && feedback === 'wrong') stateClass = 'border-red-500 bg-neutral-800 text-red-500';
                        if (isCurrent && !feedback) stateClass = 'border-blue-500/50 bg-neutral-800/80 text-transparent animate-pulse';

                        return (
                            <div key={idx} className="flex items-center">
                                <button
                                    onClick={() => playSingleChordAudio(chord)}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center text-lg transition-all active:scale-95 ${stateClass}`}
                                >
                                    {isGuessed || feedback === 'correct' ? chord : (isCurrent ? '?' : '')}
                                </button>
                                {idx < targetSequence.length - 1 && (
                                    <ArrowRight size={16} className={`ml-3 text-neutral-800 ${isGuessed ? 'text-green-900' : ''}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

        </div>

        {/* Action Bar */}
        <div className="flex gap-4 mb-8">
            <button
                onClick={playContextOnly}
                disabled={isPlaying}
                className="px-6 py-2 bg-neutral-800 rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors flex items-center gap-2"
            >
                <RotateCcw size={14} />
                Context (I)
            </button>

            {mode === 'progression' && (
                <button
                    onClick={replayFullTarget}
                    className="px-6 py-2 bg-neutral-800 rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors flex items-center gap-2"
                >
                    <RefreshCcw size={14} /> Replay
                </button>
            )}

            <button
                onClick={stopAudio}
                className="px-4 py-2 bg-red-900/50 text-red-200 border border-red-900/50 rounded-full text-sm font-medium hover:bg-red-900 transition-colors flex items-center gap-2"
            >
                <Square size={14} fill="currentColor" /> Stop
            </button>

            <button
                onClick={() => {
                    stopAudio();
                    if (mode === 'single') generateNewChord(true);
                    else generateNewSequence(true);
                }}
                className="px-6 py-2 bg-neutral-800 rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors"
            >
                Skip
            </button>
        </div>

      </div>

      {/* Input Grid */}
      <div className="bg-neutral-950 border-t border-neutral-800 p-6 pb-8 transition-all duration-300">
        <div className={`grid gap-3 max-w-md mx-auto ${activePool.length > 8 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {activePool
                // STRICTLY HIDE TONIC BUTTON IN SINGLE MODE
                .filter(c => mode === 'single' ? c !== 'I' : true)
                .sort()
                .map(chord => (
                <button
                    key={chord}
                    onClick={() => handleGuess(chord)}
                    className={`h-14 rounded-lg font-semibold text-sm transition-all active:scale-95 border-b-2
                        ${feedback === 'correct' && ((mode === 'single' && chord === targetChord))
                            ? 'bg-green-600 border-green-800 text-white'
                            : 'bg-neutral-800 border-neutral-900 text-neutral-300 hover:bg-neutral-700'
                        }
                        ${feedback === 'wrong' && ((mode === 'single' && chord !== targetChord) || mode === 'progression') ? 'opacity-50' : ''}
                    `}
                >
                    {chord}
                </button>
            ))}
            {activePool.length === 0 && (
                <div className="col-span-full text-center text-neutral-500 py-4">
                    No chords selected. Check settings.
                </div>
            )}
        </div>
      </div>

      {/* Settings Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom-10 fade-in">
            <div className="flex justify-between items-center p-6 border-b border-neutral-800">
                <h2 className="text-xl font-bold text-white">Configuration</h2>
                <button onClick={() => setShowConfig(false)} className="p-2 bg-neutral-800 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Presets</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(PRESETS).map(name => (
                            <button
                                key={name}
                                onClick={() => loadPreset(name)}
                                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-700 hover:border-neutral-500 transition-all"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.entries(groupedChords).map(([group, chords]) => (
                        <div key={group}>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 sticky top-0 bg-neutral-950/95 py-2">
                                {group}
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {chords.map(chord => {
                                    const isActive = activePool.includes(chord);
                                    return (
                                        <button
                                            key={chord}
                                            onClick={() => toggleChord(chord)}
                                            className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all border
                                                ${isActive
                                                    ? 'bg-neutral-200 text-black border-white'
                                                    : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-600'
                                                }`}
                                        >
                                            {chord}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-10" />
            </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
