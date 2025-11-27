
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    // Safety check for VexFlow
    const VF = typeof Vex !== 'undefined' ? Vex.Flow : null;

    // --- CONSTANTS ---

    const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const KEY_SPECS = {
        // Map Root Index (0-11) to VexFlow Key Strings
        // 0=C, 1=C#, 2=D, 3=Eb, 4=E, 5=F, 6=F#, 7=G, 8=Ab, 9=A, 10=Bb, 11=B
        "C": "C", "C#": "C#", "D": "D", "D#": "Eb", "E": "E", "F": "F", "F#": "F#", "G": "G", "G#": "Ab", "A": "A", "A#": "Bb", "B": "B"
    };

    const KEY_MAP = {
        // Lower Octave (starts C3 = 48)
        'z': 48, 's': 49, 'x': 50, 'd': 51, 'c': 52, 'v': 53,
        'g': 54, 'b': 55, 'h': 56, 'n': 57, 'j': 58, 'm': 59,
        ',': 60, '.': 61,
        // Upper Octave (starts C4 = 60)
        'q': 60, '2': 61, 'w': 62, '3': 63, 'e': 64, 'r': 65,
        '5': 66, 't': 67, '6': 68, 'y': 69, '7': 70, 'u': 71,
        'i': 72, '9': 73, 'o': 74, '0': 75, 'p': 76
    };

    const SCALES = {
        major: { name: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11] },
        minor: { name: "Minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10] },
        dorian: { name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
        phrygian: { name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
        lydian: { name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
        mixolydian: { name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
        locrian: { name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
    };

    // --- DYNAMIC INTERVAL GENERATION ---

    const BASE_QUALITIES = {
        'Maj': { intervals: [0, 4, 7], label: 'Maj' },
        'Min': { intervals: [0, 3, 7], label: 'm' },
        'Dim': { intervals: [0, 3, 6], label: 'dim' },
        'Aug': { intervals: [0, 4, 8], label: 'aug' },
        'Sus2': { intervals: [0, 2, 7], label: 'sus2' },
        'Sus4': { intervals: [0, 5, 7], label: 'sus4' },
    };

    const EXTENSIONS = {
        'None': { add: [], suffix: '' },
        '7 (Dom)': { add: [10], suffix: '7', compatible: ['Maj'] }, // Maj triad + b7 = Dom7
        '7 (Min)': { add: [10], suffix: '7', compatible: ['Min'] }, // Min triad + b7 = m7
        'Maj7': { add: [11], suffix: 'Maj7' },
        'm7b5': { add: [10], suffix: 'm7b5', compatible: ['Dim'] }, // Dim triad + b7
        'dim7': { add: [9], suffix: '7', compatible: ['Dim'] }, // Dim triad + bb7 (6) = dim7
        'add9': { add: [14], suffix: 'add9' },
        '9': { add: [10, 14], suffix: '9' }, // Implies 7th usually
        'Maj9': { add: [11, 14], suffix: 'Maj9' },
        '11': { add: [10, 14, 17], suffix: '11' },
    };

    const getIntervals = (baseKey, extKey) => {
        const base = BASE_QUALITIES[baseKey] || BASE_QUALITIES['Maj'];
        const ext = EXTENSIONS[extKey] || EXTENSIONS['None'];

        // Combine unique intervals, sort them
        const combined = [...new Set([...base.intervals, ...ext.add])].sort((a,b) => a-b);

        // Construct smart name
        let name = base.label;
        if (ext.suffix) {
            // Special naming rules
            if (baseKey === 'Maj' && extKey === '7 (Dom)') name = '7'; // C + 7 = C7
            else if (baseKey === 'Min' && extKey === '7 (Min)') name = 'm7'; // Cm + 7 = Cm7
            else if (baseKey === 'Dim' && extKey === 'm7b5') name = 'm7b5'; // Cdim + 7 = Cm7b5
            else if (baseKey === 'Dim' && extKey === 'dim7') name = 'dim7';
            else name += ext.suffix;
        }

        // Clean up redundant strings
        name = name.replace("MajMaj", "Maj").replace("mm", "m").replace("dimdim", "dim");

        return { intervals: combined, suffix: name };
    };

    const getFreq = (note) => 440 * Math.pow(2, (note - 69) / 12);

    // --- AUDIO ENGINE ---

    class Synth {
        constructor() {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.oscillators = {};
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // slightly softer
            const compressor = this.ctx.createDynamicsCompressor();
            this.masterGain.connect(compressor);
            compressor.connect(this.ctx.destination);
        }

        resume() {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playNote(midiNote, velocity = 1) {
            this.resume();
            if (this.oscillators[midiNote]) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine'; // Soft electric piano
            osc.frequency.setValueAtTime(getFreq(midiNote), this.ctx.currentTime);

            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(velocity, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(velocity * 0.6, now + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            this.oscillators[midiNote] = { osc, gain };
        }

        stopNote(midiNote) {
            if (this.oscillators[midiNote]) {
                const { osc, gain } = this.oscillators[midiNote];
                const now = this.ctx.currentTime;

                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc.stop(now + 0.16);
                delete this.oscillators[midiNote];
            }
        }

        // Play chord purely for audio
        playChordAudio(notes, duration = 800) {
            this.resume();
            notes.forEach(n => {
                this.playNote(n, 0.5);
                setTimeout(() => this.stopNote(n), duration);
            });
        }
    }

    const audio = new Synth();

    // --- VEXFLOW COMPONENT ---

    const Staff = ({ activeNotes, rootNote, scaleType }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            const div = containerRef.current;
            if (!div || !VF) return;

            div.innerHTML = '';

            try {
                const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
                renderer.resize(400, 140);
                const context = renderer.getContext();

                // Create Stave
                const stave = new VF.Stave(10, 10, 380);

                // Determine Key Signature
                // Map Root Index to VexFlow Key Specs
                const rootName = NOTES[rootNote];
                // VexFlow KeySpec needs to handle 'b' for flats properly (Db, Eb, etc.)
                let vfKey = KEY_SPECS[rootName] || "C";

                // Adjust for scale type (Basic relative major mapping for simplicty)
                // Minor keys in Vexflow usually handled by passing "Am", "Cm" etc.
                if (scaleType.includes('minor') || scaleType === 'dorian' || scaleType === 'phrygian' || scaleType === 'locrian') {
                     vfKey += "m";
                     // This is a simplification. Strictly:
                     // Dorian is technically minor key sig of (Root - 2 semitones)
                     // But showing the minor key sig of the Root is often more helpful for reading context in this app.
                }

                stave.addClef("treble");
                stave.addKeySignature(vfKey);
                stave.setContext(context).draw();

                if (activeNotes.length > 0) {
                    // Shift octaves for visual clarity if too low
                    const visualNotes = activeNotes.map(n => n < 53 ? n + 12 : n).sort((a, b) => a - b);

                    const keys = visualNotes.map(midi => {
                        const noteName = NOTES[midi % 12].toLowerCase();
                        const octave = Math.floor(midi / 12) - 1;
                        return `${noteName}/${octave}`;
                    });

                    // Remove dupes
                    const uniqueKeys = [...new Set(keys)];

                    const chord = new VF.StaveNote({
                        keys: uniqueKeys,
                        duration: "w",
                        align_center: true,
                        auto_stem: true
                    });

                    // Apply accidentals - BUT respect key signature!
                    // VexFlow auto-hides accidentals in key signature if we don't force them
                    // But we constructed the notes as raw chromatics.
                    // Ideally we let VexFlow decide. But standard behavior with addModifier is explicit.
                    // We'll leave explicit accidentals for now as it's safer for generated chords
                    uniqueKeys.forEach((key, index) => {
                        if (key.includes("#")) {
                            chord.addModifier(new VF.Accidental("#"), index);
                        }
                    });

                    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
                    voice.addTickables([chord]);

                    new VF.Formatter().joinVoices([voice]).format([voice], 300);
                    voice.draw(context, stave);
                }
            } catch (e) {
                // VexFlow errors are common with weird note combos
                console.warn(e);
            }

        }, [activeNotes, rootNote, scaleType]);

        return <div ref={containerRef} className="bg-[#fff9f0] rounded-lg shadow-inner flex justify-center py-2 h-[140px]" />;
    };

    // --- MAIN APP ---

    const App = () => {
        // State
        const [activeNotes, setActiveNotes] = useState([]); // Visual + Audio
        const [visualNotes, setVisualNotes] = useState([]); // Extra visual layer for chord playback

        const [rootNote, setRootNote] = useState(0);
        const [scaleType, setScaleType] = useState('major');
        const [chordComplexity, setChordComplexity] = useState('triad');

        const [scratchpad, setScratchpad] = useState([]);
        const [latchMode, setLatchMode] = useState(false);
        const [bpm, setBpm] = useState(100);

        // Builder State
        const [builderRoot, setBuilderRoot] = useState(0);
        const [builderBase, setBuilderBase] = useState('Maj');
        const [builderExt, setBuilderExt] = useState('None');
        const [builderBass, setBuilderBass] = useState(-1);

        const heldKeys = useRef(new Set());

        // Fix Icons
        useEffect(() => {
            if (window.lucide) window.lucide.createIcons();
        });

        // Combined visual state
        const displayedNotes = useMemo(() => {
            return [...new Set([...activeNotes, ...visualNotes])];
        }, [activeNotes, visualNotes]);

        // --- PLAYBACK SYSTEM ---

        const triggerChord = useCallback((notes, duration = 800) => {
            audio.playChordAudio(notes, duration);
            setVisualNotes(notes);
            setTimeout(() => {
                setVisualNotes(prev => prev === notes ? [] : prev);
            }, duration * 0.9);
        }, []);

        // --- INPUT HANDLERS ---

        useEffect(() => {
            if (navigator.requestMIDIAccess) {
                navigator.requestMIDIAccess().then((midi) => {
                    const inputs = midi.inputs.values();
                    for (let input of inputs) input.onmidimessage = handleMIDIMessage;
                }, () => console.log("MIDI Access Denied"));
            }
        }, [latchMode]);

        const handleMIDIMessage = (message) => {
            const [command, note, velocity] = message.data;
            if (command === 144 && velocity > 0) {
                audio.playNote(note);
                setActiveNotes(prev => prev.includes(note) ? prev : [...prev, note]);
            } else if (command === 128 || (command === 144 && velocity === 0)) {
                audio.stopNote(note);
                setActiveNotes(prev => prev.filter(n => n !== note));
            }
        };

        useEffect(() => {
            const handleKeyDown = (e) => {
                if (e.repeat || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
                const note = KEY_MAP[e.key.toLowerCase()];
                if (note && !heldKeys.current.has(note)) {
                    heldKeys.current.add(note);
                    latchMode ? toggleNote(note) : (audio.playNote(note), setActiveNotes(p => [...p, note]));
                }
            };
            const handleKeyUp = (e) => {
                const note = KEY_MAP[e.key.toLowerCase()];
                if (note) {
                    heldKeys.current.delete(note);
                    if (!latchMode) {
                        audio.stopNote(note);
                        setActiveNotes(p => p.filter(n => n !== note));
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }, [latchMode, activeNotes]);

        const toggleNote = (note) => {
            if (activeNotes.includes(note)) {
                audio.stopNote(note);
                setActiveNotes(prev => prev.filter(n => n !== note));
            } else {
                audio.playNote(note);
                setActiveNotes(prev => [...prev, note]);
            }
        };

        const handleKeyStart = (note) => {
            latchMode ? toggleNote(note) : (audio.playNote(note), setActiveNotes(prev => [...prev, note]));
        };

        const handleKeyStop = (note) => {
            if (!latchMode) {
                audio.stopNote(note);
                setActiveNotes(prev => prev.filter(n => n !== note));
            }
        };

        // --- CHORD CALCULATORS ---

        const mapQualityToBuilder = (qualityKey) => {
            if (qualityKey === 'maj') return { base: 'Maj', ext: 'None' };
            if (qualityKey === 'min') return { base: 'Min', ext: 'None' };
            if (qualityKey === 'dim') return { base: 'Dim', ext: 'None' };
            if (qualityKey === 'aug') return { base: 'Aug', ext: 'None' };

            if (qualityKey === 'dom7') return { base: 'Maj', ext: '7 (Dom)' };
            if (qualityKey === 'maj7') return { base: 'Maj', ext: 'Maj7' };
            if (qualityKey === 'min7') return { base: 'Min', ext: '7 (Min)' };
            if (qualityKey === 'm7b5') return { base: 'Dim', ext: 'm7b5' };
            if (qualityKey === 'dim7') return { base: 'Dim', ext: 'dim7' };

            if (qualityKey === 'add9') return { base: 'Maj', ext: 'add9' };
            if (qualityKey === 'maj9') return { base: 'Maj', ext: 'Maj9' };
            if (qualityKey === 'min9') return { base: 'Min', ext: '9' };

            return { base: 'Maj', ext: 'None' };
        };

        const getDiatonicChord = (rootIndex, qualityKey) => {
            const OLD_QUALITY = {
                maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
                dom7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10],
                m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9],
                add9: [0, 4, 7, 14], maj9: [0, 4, 7, 11, 14], min9: [0, 3, 7, 10, 14]
            };

            const intervals = OLD_QUALITY[qualityKey] || OLD_QUALITY['maj'];
            const notes = intervals.map(i => 60 + rootIndex + i);
            let name = `${NOTES[rootIndex]}${qualityKey.replace('maj','').replace('min','m').replace('dom7','7')}`;

            const dna = mapQualityToBuilder(qualityKey);

            return {
                name, notes, degree: '',
                rootIndex, base: dna.base, ext: dna.ext, bassIndex: -1
            };
        };

        const diatonicChords = useMemo(() => {
            const intervals = SCALES[scaleType].intervals;
            const chords = [];

            intervals.forEach((rootInt, i) => {
                const getDist = (offset) => {
                     const targetNote = (rootNote + intervals[(i + offset) % 7]);
                     const currentRoot = (rootNote + rootInt);
                     return (targetNote - currentRoot + 12) % 12;
                };

                const third = getDist(2);
                const fifth = getDist(4);
                const seventh = getDist(6);

                let quality = "maj";
                if (third === 4 && fifth === 7) quality = "maj";
                else if (third === 3 && fifth === 7) quality = "min";
                else if (third === 3 && fifth === 6) quality = "dim";
                else if (third === 4 && fifth === 8) quality = "aug";

                if (chordComplexity !== 'triad') {
                     if (quality === "maj" && seventh === 11) quality = "maj7";
                     if (quality === "maj" && seventh === 10) quality = "dom7";
                     if (quality === "min" && seventh === 10) quality = "min7";
                     if (quality === "dim" && seventh === 10) quality = "m7b5";
                     if (quality === "dim" && seventh === 9) quality = "dim7";
                }

                if (chordComplexity === '9th') {
                     if (!quality.includes("9")) quality = quality.replace("7", "9");
                     if (quality === "maj") quality = "add9";
                     if (quality === "min") quality = "min9";
                }

                const chordObj = getDiatonicChord((rootNote + rootInt)%12, quality);

                const romans = ["I", "II", "III", "IV", "V", "VI", "VII"];
                let roman = romans[i];
                if (quality.includes("min") || quality.includes("dim")) roman = roman.toLowerCase();

                chordObj.degree = roman;
                chords.push(chordObj);
            });
            return chords;
        }, [rootNote, scaleType, chordComplexity]);


        // --- BUILDER LOGIC (Dynamic) ---

        const builderChord = useMemo(() => {
            const { intervals, suffix } = getIntervals(builderBase, builderExt);

            // Generate notes (Start Middle C4 = 60)
            const notes = intervals.map(int => 60 + builderRoot + int);

            let name = NOTES[builderRoot] + suffix;

            // Slash Bass Voicing Logic
            // Goal: Keep bass close to the chord (usually within an octave below)
            if (builderBass !== -1) {
                name += `/${NOTES[builderBass]}`;

                // Calculate bass MIDI note
                // Start with a standard bass range (e.g. C3 = 48)
                let bassMidi = 48 + builderBass;

                // Get the root of the actual chord we just built
                const chordRoot = 60 + builderRoot;

                // While bass is too far below chord (gap > 17 semitones), move it up
                while (bassMidi < chordRoot - 17) {
                    bassMidi += 12;
                }

                // While bass is colliding or above chord (gap < 5 semitones), move it down
                while (bassMidi > chordRoot - 5) {
                    bassMidi -= 12;
                }

                notes.unshift(bassMidi);
            }

            return {
                name, notes, fullName: name,
                rootIndex: builderRoot,
                base: builderBase,
                ext: builderExt,
                bassIndex: builderBass
            };
        }, [builderRoot, builderBase, builderExt, builderBass]);

        useEffect(() => {
            triggerChord(builderChord.notes, 600);
        }, [builderChord.notes.join(',')]);

        const loadChordToBuilder = (chord) => {
            if (chord.rootIndex !== undefined) setBuilderRoot(chord.rootIndex);
            if (chord.base) setBuilderBase(chord.base);
            if (chord.ext) setBuilderExt(chord.ext);
            if (chord.bassIndex !== undefined) setBuilderBass(chord.bassIndex);
        };

        // --- SEQUENCER ---

        const addChordToPad = (chord) => {
             setScratchpad([...scratchpad, { ...chord, id: Date.now(), duration: 4 }]);
        };

        const updatePadItem = (id, updates) => {
            setScratchpad(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        };

        const movePadItem = (index, direction) => {
            const newPad = [...scratchpad];
            if (direction === -1 && index > 0) {
                [newPad[index], newPad[index - 1]] = [newPad[index - 1], newPad[index]];
            } else if (direction === 1 && index < newPad.length - 1) {
                [newPad[index], newPad[index + 1]] = [newPad[index + 1], newPad[index]];
            }
            setScratchpad(newPad);
        };

        const playSequence = async () => {
            let time = 0;
            const msPerBeat = 60000 / bpm;

            scratchpad.forEach(chord => {
                setTimeout(() => {
                    triggerChord(chord.notes, chord.duration * msPerBeat);
                }, time);
                time += (chord.duration * msPerBeat);
            });
        };

        // --- COMPONENTS ---

        const Keyboard = () => {
             const keys = [];
             for(let i=48; i<=84; i++) {
                 keys.push({ midi: i, isBlack: [1,3,6,8,10].includes(i%12), label: NOTES[i%12] });
             }

             const whiteKeys = keys.filter(k => !k.isBlack);

             return (
                 <div className="relative h-28 select-none overflow-hidden rounded-b-lg bg-gray-900 border-t border-gray-700 shadow-xl">
                     <div className="flex h-full px-2">
                         {whiteKeys.map((wk) => {
                             const nextMidi = wk.midi + 1;
                             const hasBlack = [1,3,6,8,10].includes(nextMidi % 12) && nextMidi <= 84;

                             const isWhiteActive = displayedNotes.includes(wk.midi);
                             const isBlackActive = hasBlack && displayedNotes.includes(nextMidi);

                             return (
                                 <div
                                    key={wk.midi}
                                    className={`relative flex-1 bg-white border-l border-gray-300 first:border-l-0 rounded-b-sm active:bg-blue-100 ${isWhiteActive ? '!bg-blue-300' : ''}`}
                                    onMouseDown={() => handleKeyStart(wk.midi)}
                                    onMouseUp={() => handleKeyStop(wk.midi)}
                                    onMouseEnter={(e) => e.buttons === 1 && !latchMode && handleKeyStart(wk.midi)}
                                    onMouseLeave={() => !latchMode && handleKeyStop(wk.midi)}
                                    onTouchStart={(e) => { e.preventDefault(); handleKeyStart(wk.midi); }}
                                    onTouchEnd={(e) => { e.preventDefault(); handleKeyStop(wk.midi); }}
                                 >
                                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-sans pointer-events-none">{wk.label}</span>

                                    {hasBlack && (
                                        <div
                                            className={`absolute top-0 h-16 bg-gray-900 rounded-b border border-black z-10 cursor-pointer hover:bg-gray-800 ${isBlackActive ? '!bg-blue-600' : ''}`}
                                            style={{ width: '60%', right: '-30%' }}
                                            onMouseDown={(e) => { e.stopPropagation(); handleKeyStart(nextMidi); }}
                                            onMouseUp={(e) => { e.stopPropagation(); handleKeyStop(nextMidi); }}
                                            onMouseEnter={(e) => { e.stopPropagation(); if(e.buttons === 1 && !latchMode) handleKeyStart(nextMidi); }}
                                            onMouseLeave={(e) => { e.stopPropagation(); if(!latchMode) handleKeyStop(nextMidi); }}
                                            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleKeyStart(nextMidi); }}
                                            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleKeyStop(nextMidi); }}
                                        >
                                        </div>
                                    )}
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             );
        };

        return (
            <div className="max-w-5xl mx-auto min-h-screen pb-40">
                <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-3 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <i data-lucide="music" className="text-blue-500"></i>
                            <h1 className="font-bold text-lg tracking-tight">Songwriter's Codex</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-800 rounded-md p-1 border border-slate-600">
                                <select
                                    value={rootNote} onChange={(e) => setRootNote(parseInt(e.target.value))}
                                    className="bg-transparent text-white font-bold p-1 text-sm outline-none"
                                >
                                    {NOTES.map((n, i) => <option key={n} value={i}>{n}</option>)}
                                </select>
                                <span className="text-slate-600 mx-1">/</span>
                                <select
                                    value={scaleType} onChange={(e) => setScaleType(e.target.value)}
                                    className="bg-transparent text-blue-400 font-bold p-1 text-sm outline-none w-24 sm:w-auto"
                                >
                                    {Object.keys(SCALES).map(s => <option key={s} value={s}>{SCALES[s].name}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={() => setLatchMode(!latchMode)}
                                className={`text-xs px-3 py-2 rounded font-bold border transition-all ${latchMode ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                            >
                                HOLD
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-2 space-y-3">

                    {/* TOP VISUALIZER & KEYBOARD */}
                    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700">
                        <div className="p-2 pb-0">
                            <Staff activeNotes={displayedNotes} rootNote={rootNote} scaleType={scaleType} />
                        </div>
                        <Keyboard />
                        <div className="bg-slate-900 p-1 text-center text-[10px] text-slate-500 rounded-b-xl border-t border-slate-700">
                            [Z...M] Lower Octave &bull; [Q...P] Upper Octave &bull; Clicking Pad/Builder lights up keys
                        </div>
                    </div>

                    {/* DIATONIC PALETTE */}
                    <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="grid" className="w-4 h-4"></i> Scale Chords
                            </h2>
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="flex gap-1 bg-slate-900 p-1 rounded overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                                    {['major', 'minor', 'dorian', 'mixolydian'].map(m => (
                                        <button
                                            key={m} onClick={() => setScaleType(m)}
                                            className={`px-2 py-1 text-[10px] uppercase rounded font-bold ${scaleType === m ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-400'}`}
                                        >
                                            {m.slice(0,3)}
                                        </button>
                                    ))}
                                </div>
                                <div className="w-px h-4 bg-slate-700 mx-1 hidden sm:block"></div>
                                <div className="flex bg-slate-900 rounded p-1 text-xs">
                                    {['triad', '7th', '9th'].map(c => (
                                        <button
                                            key={c} onClick={() => setChordComplexity(c)}
                                            className={`px-3 py-1 rounded capitalize ${chordComplexity === c ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {diatonicChords.map((chord, i) => (
                                <div key={i} className="group relative">
                                    <button
                                        onClick={() => triggerChord(chord.notes)}
                                        className="w-full aspect-square flex flex-col items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 active:border-blue-500 transition-all"
                                    >
                                        <span className="text-xs text-blue-400 font-mono mb-1 opacity-70">{chord.degree}</span>
                                        <span className="font-bold text-white text-sm sm:text-base">{chord.name}</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); addChordToPad(chord) }}
                                        className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition-opacity text-xs"
                                    >
                                        <i data-lucide="plus" className="w-3 h-3"></i>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); loadChordToBuilder(chord); }}
                                        className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition-opacity text-xs"
                                        title="Edit in Lab"
                                    >
                                        <i data-lucide="edit-2" className="w-3 h-3"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">

                        {/* CHORD LAB (BUILDER) */}
                        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 flex flex-col">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i data-lucide="wrench" className="w-4 h-4"></i> Lab
                            </h2>

                            <div className="bg-slate-900 rounded p-4 text-center mb-4 border border-slate-700 flex-grow flex flex-col justify-center items-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"></div>
                                <div className="text-4xl font-bold text-white tracking-tight relative z-10">{builderChord.fullName}</div>
                                <div className="flex gap-2 mt-4 relative z-10">
                                    <button
                                        onClick={() => triggerChord(builderChord.notes)}
                                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold"
                                    >
                                        <i data-lucide="volume-2" className="w-3 h-3"></i> Hear
                                    </button>
                                    <button
                                        onClick={() => addChordToPad(builderChord)}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold shadow-lg shadow-blue-900/50"
                                    >
                                        Add to Pad <i data-lucide="arrow-right" className="w-3 h-3"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {/* Root */}
                                <div>
                                    <label className="block text-slate-500 mb-1 font-bold">Root</label>
                                    <div className="grid grid-cols-2 gap-1">
                                        {NOTES.map((n, i) => (
                                            <button
                                                key={n} onClick={() => setBuilderRoot(i)}
                                                className={`py-1 rounded font-bold ${builderRoot === i ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Base Quality */}
                                <div>
                                    <label className="block text-slate-500 mb-1 font-bold">Base</label>
                                    <div className="flex flex-col gap-1 h-40 overflow-y-auto no-scrollbar">
                                        {Object.keys(BASE_QUALITIES).map(q => (
                                            <button
                                                key={q} onClick={() => setBuilderBase(q)}
                                                className={`py-1 px-2 rounded text-left font-medium ${builderBase === q ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Extension */}
                                <div>
                                    <label className="block text-slate-500 mb-1 font-bold">Ext</label>
                                    <div className="flex flex-col gap-1 h-40 overflow-y-auto no-scrollbar">
                                        {Object.keys(EXTENSIONS).map(e => (
                                            <button
                                                key={e} onClick={() => setBuilderExt(e)}
                                                className={`py-1 px-2 rounded text-left font-medium ${builderExt === e ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-slate-500 mb-1 text-xs font-bold">Slash / Bass</label>
                                <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
                                    <button onClick={() => setBuilderBass(-1)} className={`flex-shrink-0 px-3 py-2 rounded text-xs font-bold ${builderBass === -1 ? 'bg-red-900/50 text-red-200 border border-red-900' : 'bg-slate-700'}`}>None</button>
                                    {NOTES.map((n, i) => (
                                        <button key={i} onClick={() => setBuilderBass(i)} className={`flex-shrink-0 px-3 py-2 rounded text-xs font-bold ${builderBass === i ? 'bg-purple-600 text-white' : 'bg-slate-700'}`}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SEQUENCER PAD */}
                        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <i data-lucide="list-music" className="w-4 h-4"></i> Pad
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-slate-900 rounded px-2 py-1 border border-slate-700">
                                        <span className="text-[10px] text-slate-500 mr-2">BPM</span>
                                        <input
                                            type="number" value={bpm} onChange={e => setBpm(e.target.value)}
                                            className="w-8 bg-transparent text-xs text-white text-center outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={playSequence}
                                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded font-bold flex items-center gap-1 shadow-lg shadow-green-900/30"
                                    >
                                        <i data-lucide="play" className="w-3 h-3"></i> Play
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow space-y-2 overflow-y-auto max-h-[400px] pr-1 no-scrollbar">
                                {scratchpad.map((chord, i) => (
                                    <div key={chord.id} className="group flex items-center gap-2 bg-slate-700/40 hover:bg-slate-700 p-2 rounded border border-transparent hover:border-slate-500 transition-all">
                                        {/* Ordering */}
                                        <div className="flex flex-col gap-0.5 opacity-50 hover:opacity-100">
                                            <button onClick={() => movePadItem(i, -1)} className="text-slate-400 hover:text-white"><i data-lucide="chevron-up" className="w-3 h-3"></i></button>
                                            <button onClick={() => movePadItem(i, 1)} className="text-slate-400 hover:text-white"><i data-lucide="chevron-down" className="w-3 h-3"></i></button>
                                        </div>

                                        {/* Chord Info */}
                                        <div className="flex-grow flex items-center gap-3 cursor-pointer" onClick={() => triggerChord(chord.notes)}>
                                            <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded font-mono text-xs text-slate-500">{i+1}</div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-lg leading-none">{chord.name}</span>
                                                <span className="text-[10px] text-slate-400">{chord.degree || "Custom"}</span>
                                            </div>
                                        </div>

                                        {/* Beats/Duration */}
                                        <div className="flex flex-col items-center bg-slate-900 rounded px-1 border border-slate-700">
                                            <span className="text-[9px] text-slate-500 uppercase">Beats</span>
                                            <select
                                                value={chord.duration}
                                                onChange={(e) => updatePadItem(chord.id, { duration: parseInt(e.target.value) })}
                                                className="bg-transparent text-xs font-bold text-blue-400 outline-none text-center appearance-none"
                                            >
                                                {[1,2,3,4,6,8].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => loadChordToBuilder(chord)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded" title="Edit in Lab">
                                                <i data-lucide="edit-3" className="w-3.5 h-3.5"></i>
                                            </button>
                                            <button onClick={() => setScratchpad(scratchpad.filter(c => c.id !== chord.id))} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded" title="Remove">
                                                <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {scratchpad.length === 0 && (
                                    <div className="text-center py-10 text-slate-600 text-sm border-2 border-dashed border-slate-700 rounded-lg">
                                        Pad is empty.
                                    </div>
                                )}
                            </div>

                            {scratchpad.length > 0 && (
                                <button onClick={() => setScratchpad([])} className="mt-4 text-xs text-red-400 hover:text-red-300 self-center hover:underline">
                                    Clear Pad
                                </button>
                            )}
                        </div>
                    </div>

                </main>
            </div>
        );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
