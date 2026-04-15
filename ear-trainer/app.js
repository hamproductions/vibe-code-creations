const { useEffect, useMemo, useRef, useState, useCallback } = React

const STORAGE_KEY = "chordvibe-ear-lab-v4"
const KEY_HINTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="]
const NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
const NOTE_TO_PC = Object.fromEntries(NOTE_NAMES.map((name, index) => [name, index]))

const DEGREES = [
  ["1", 0, "do / tonic"], ["b2", 1, "ra / flat second"], ["2", 2, "re / second"], ["b3", 3, "me / minor third"],
  ["3", 4, "mi / major third"], ["4", 5, "fa / fourth"], ["#4/b5", 6, "tritone"], ["5", 7, "sol / fifth"],
  ["b6", 8, "le / minor sixth"], ["6", 9, "la / major sixth"], ["b7", 10, "te / minor seventh"], ["7", 11, "ti / leading tone"]
].map(([id, semitones, subtitle]) => ({ id, label: id, semitones, subtitle }))

const INTERVALS = [
  ["m2",1],["M2",2],["m3",3],["M3",4],["P4",5],["TT",6],["P5",7],["m6",8],["M6",9],["m7",10],["M7",11],["P8",12],
  ["m9",13],["M9",14],["m10",15],["M10",16],["P11",17],["#11",18],["P12",19],["m13",20],["M13",21]
].map(([id, semitones]) => ({ id, label: id, semitones, subtitle: `${semitones} semitones` }))

const CHORDS = [
  ["major","Major","1 3 5",[0,4,7],"Core"],["minor","Minor","1 b3 5",[0,3,7],"Core"],["diminished","Diminished","1 b3 b5",[0,3,6],"Core"],
  ["augmented","Augmented","1 3 #5",[0,4,8],"Core"],["sus2","sus2","1 2 5",[0,2,7],"Core"],["sus4","sus4","1 4 5",[0,5,7],"Core"],
  ["M7","M7","1 3 5 7",[0,4,7,11],"7th"],["m7","m7","1 b3 5 b7",[0,3,7,10],"7th"],["7","7","1 3 5 b7",[0,4,7,10],"7th"],
  ["m7b5","m7b5","1 b3 b5 b7",[0,3,6,10],"7th"],["dim7","dim7","1 b3 b5 bb7",[0,3,6,9],"7th"],["mM7","mM7","1 b3 5 7",[0,3,7,11],"7th"],
  ["M7#5","M7#5","1 3 #5 7",[0,4,8,11],"7th"],["7sus4","7sus4","1 4 5 b7",[0,5,7,10],"7th"],
  ["9","9","1 3 5 b7 9",[0,4,7,10,14],"Color"],["M9","M9","1 3 5 7 9",[0,4,7,11,14],"Color"],["m9","m9","1 b3 5 b7 9",[0,3,7,10,14],"Color"],
  ["13","13","1 3 5 b7 9 13",[0,4,7,10,14,21],"Color"],["7b9","7b9","1 3 5 b7 b9",[0,4,7,10,13],"Altered"],["7#9","7#9","1 3 5 b7 #9",[0,4,7,10,15],"Altered"],
  ["7b5","7b5","1 3 b5 b7",[0,4,6,10],"Altered"],["7#5","7#5","1 3 #5 b7",[0,4,8,10],"Altered"],["7b9b5","7b9b5","1 3 b5 b7 b9",[0,4,6,10,13],"Altered"],
  ["7b9#5","7b9#5","1 3 #5 b7 b9",[0,4,8,10,13],"Altered"],["7#9b5","7#9b5","1 3 b5 b7 #9",[0,4,6,10,15],"Altered"],["7#9#5","7#9#5","1 3 #5 b7 #9",[0,4,8,10,15],"Altered"]
].map(([id, label, subtitle, intervals, group]) => ({ id, label, subtitle, intervals, group }))

const SCALES = [
  ["ionian","Ionian","1 2 3 4 5 6 7",[0,2,4,5,7,9,11],"Modes"],["dorian","Dorian","1 2 b3 4 5 6 b7",[0,2,3,5,7,9,10],"Modes"],
  ["phrygian","Phrygian","1 b2 b3 4 5 b6 b7",[0,1,3,5,7,8,10],"Modes"],["lydian","Lydian","1 2 3 #4 5 6 7",[0,2,4,6,7,9,11],"Modes"],
  ["mixolydian","Mixolydian","1 2 3 4 5 6 b7",[0,2,4,5,7,9,10],"Modes"],["aeolian","Aeolian","1 2 b3 4 5 b6 b7",[0,2,3,5,7,8,10],"Modes"],
  ["locrian","Locrian","1 b2 b3 4 b5 b6 b7",[0,1,3,5,6,8,10],"Modes"],["melodic-minor","Melodic Minor","1 2 b3 4 5 6 7",[0,2,3,5,7,9,11],"Jazz"],
  ["lydian-dominant","Lydian Dominant","1 2 3 #4 5 6 b7",[0,2,4,6,7,9,10],"Jazz"],["altered","Altered Scale","1 b2 #2 3 b5 #5 b7",[0,1,3,4,6,8,10],"Jazz"],
  ["harmonic-minor","Harmonic Minor","1 2 b3 4 5 b6 7",[0,2,3,5,7,8,11],"Minor"],["phrygian-dominant","Phrygian Dominant","1 b2 3 4 5 b6 b7",[0,1,4,5,7,8,10],"Minor"],
  ["whole-tone","Whole Tone","1 2 3 #4 #5 b7",[0,2,4,6,8,10],"Symmetrical"],["half-whole-diminished","Half-Whole Diminished","1 b2 #2 3 #4 5 6 b7",[0,1,3,4,6,7,9,10],"Symmetrical"],
  ["major-pentatonic","Major Pentatonic","1 2 3 5 6",[0,2,4,7,9],"Pentatonic"],["minor-pentatonic","Minor Pentatonic","1 b3 4 5 b7",[0,3,5,7,10],"Pentatonic"],
  ["blues","Blues","1 b3 4 b5 5 b7",[0,3,5,6,7,10],"Pentatonic"],["insen","In Sen","1 b2 4 5 b7",[0,1,5,7,10],"Japanese"],["hirajoshi","Hirajoshi","1 2 b3 5 b6",[0,2,3,7,8],"Japanese"]
].map(([id, label, subtitle, semitones, group]) => ({ id, label, subtitle, semitones, group }))

const PROGRESSIONS = [
  ["I-V-vi-IV","pop axis",[["I","major"],["V","major"],["vi","minor"],["IV","major"]],"Pop"],
  ["IV-V-iii-vi","oudou shinkou",[["IV","major"],["V","major"],["iii","minor"],["vi","minor"]],"Pop"],
  ["vi-IV-I-V","komuro",[["vi","minor"],["IV","major"],["I","major"],["V","major"]],"Pop"],
  ["ii-V-I","major cadence",[["ii","m7"],["V","7"],["I","M7"]],"Jazz"],
  ["ii-V-i","minor cadence",[["ii","m7b5"],["V","7b9"],["i","mM7"]],"Jazz"],
  ["iii-vi-ii-V","cycle",[["iii","m7"],["vi","m7"],["ii","m7"],["V","7"]],"Jazz"],
  ["IV-V-III7-vi","royal road",[["IV","M7"],["V","7"],["III","7"],["vi","m7"]],"Anisong"],
  ["bVI-bVII-I","mario cadence",[["bVI","major"],["bVII","major"],["I","major"]],"Anisong"],
  ["iv-I","borrowed iv",[["iv","minor"],["I","major"]],"Anisong"],
  ["I-Iaug-I6-I7","line cliché",[["I","major"],["I","augmented"],["I","major6"],["I","7"]],"Anisong"]
].map(([label, subtitle, steps, group]) => ({ id: label, label, subtitle, steps, group }))

const SPELLING_INTERVALS = [
  ["1",0],["b2",1],["2",2],["b3",3],["3",4],["4",5],["#4",6],["b5",6],["5",7],["#5",8],["b6",8],["6",9],
  ["b7",10],["7",11],["b9",13],["9",14],["#9",15],["11",17],["#11",18],["b13",20],["13",21]
].map(([id, semitones]) => ({ id, label: id, semitones, subtitle: `${semitones} st` }))

const CLEFS = [
  { id: "treble", label: "Treble", vexId: "treble", midiLow: 60, midiHigh: 84 },
  { id: "bass", label: "Bass", vexId: "bass", midiLow: 36, midiHigh: 60 },
  { id: "alto", label: "Alto", vexId: "alto", midiLow: 48, midiHigh: 72 },
  { id: "tenor", label: "Tenor", vexId: "tenor", midiLow: 45, midiHigh: 69 }
]

const PIANO_NOTES = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"]
const PIANO_WHITE = ["C","D","E","F","G","A","B"]
const PIANO_BLACK_MAP = { "C": "Db", "D": "Eb", "F": "Gb", "G": "Ab", "A": "Bb" }
const ENHARMONIC = { "A#":"Bb","Bb":"Bb","B#":"C","Cb":"B","C#":"Db","Db":"Db","D#":"Eb","Eb":"Eb","E#":"F","Fb":"E","F#":"Gb","Gb":"Gb","G#":"Ab","Ab":"Ab" }
function normNote(n) { return ENHARMONIC[n] || n }
const PIANO_KEYS = ["a","s","d","f","g","h","j"]

const DRILLS = [
  { id: "notes", label: "Notes", subtitle: "single note hearing", icon: "♪" },
  { id: "intervals", label: "Intervals", subtitle: "distance hearing", icon: "↔" },
  { id: "chords", label: "Chords", subtitle: "quality hearing", icon: "♫" },
  { id: "scales", label: "Scales", subtitle: "mode color", icon: "~" },
  { id: "progressions", label: "Progressions", subtitle: "harmonic shape", icon: "⟩" },
  { id: "spelling", label: "Spelling", subtitle: "chord construction", icon: "?" },
  { id: "reading", label: "Reading", subtitle: "sight reading", icon: "𝄞" }
]

const QUICK_SETS = {
  notesFunctional: {
    basic: ["1", "2", "3", "5"],
    essentials: ["1", "2", "3", "4", "5", "6", "7", "b3", "b7", "#4/b5"],
    all: DEGREES.map(item => item.id)
  },
  notesAbsolute: {
    basic: ["C", "D", "E", "F", "G", "A", "B"],
    essentials: ["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb", "F#", "Ab"],
    all: [...NOTE_NAMES]
  },
  intervals: {
    basic: ["m2", "M2", "m3", "M3", "P4", "P5"],
    essentials: ["m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "P8"],
    all: INTERVALS.map(item => item.id)
  },
  chords: {
    basic: ["major", "minor", "diminished", "augmented", "sus2", "sus4", "M7", "m7", "7"],
    essentials: ["major", "minor", "diminished", "augmented", "sus2", "sus4", "M7", "m7", "7", "m7b5", "dim7", "mM7", "7sus4", "9", "M9", "m9", "13", "7b9", "7#9"],
    all: CHORDS.map(item => item.id)
  },
  scales: {
    basic: ["ionian", "dorian", "mixolydian", "aeolian", "major-pentatonic", "minor-pentatonic", "blues"],
    essentials: ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian", "melodic-minor", "harmonic-minor", "phrygian-dominant", "major-pentatonic", "minor-pentatonic", "blues"],
    all: SCALES.map(item => item.id)
  },
  progressions: {
    basic: ["I-V-vi-IV", "ii-V-I", "ii-V-i"],
    essentials: ["I-V-vi-IV", "IV-V-iii-vi", "vi-IV-I-V", "ii-V-I", "ii-V-i", "iii-vi-ii-V", "IV-V-III7-vi", "iv-I"],
    all: PROGRESSIONS.map(item => item.id)
  },
  spellingIntervals: {
    basic: ["1","3","5","b3","b7","7"],
    essentials: ["1","b2","2","b3","3","4","5","b7","7","9","11","b13","13"],
    all: SPELLING_INTERVALS.map(item => item.id)
  },
  spellingChords: {
    basic: ["major","minor","M7","m7","7"],
    essentials: ["major","minor","diminished","augmented","M7","m7","7","m7b5","dim7","9","m9"],
    all: CHORDS.map(item => item.id)
  },
  readingClefs: {
    basic: ["treble"],
    essentials: ["treble","bass"],
    all: CLEFS.map(item => item.id)
  }
}

const DEFAULTS = {
  drillId: "notes",
  count: 10,
  autoplay: true,
  revealNotation: true,
  tonalContext: true,
  tonicPool: "starter",
  noteMode: "functional",
  presentMode: "both",
  degrees: [...QUICK_SETS.notesFunctional.essentials],
  noteNames: [...QUICK_SETS.notesAbsolute.essentials],
  intervals: [...QUICK_SETS.intervals.essentials],
  chords: [...QUICK_SETS.chords.essentials],
  scales: [...QUICK_SETS.scales.essentials],
  progressions: [...QUICK_SETS.progressions.essentials],
  spellingIntervals: [...QUICK_SETS.spellingIntervals.essentials],
  spellingChords: [...QUICK_SETS.spellingChords.essentials],
  readingClefs: [...QUICK_SETS.readingClefs.essentials]
}

function normalizeList(list, fallback, allowed) {
  const next = Array.isArray(list) ? list.filter(item => allowed.includes(item)) : []
  return next.length ? next : [...fallback]
}

function normalizeSettings(input) {
  const source = { ...DEFAULTS, ...(input || {}) }
  const drillIds = DRILLS.map(item => item.id)
  const noteMode = source.noteMode === "absolute" ? "absolute" : "functional"
  return {
    ...DEFAULTS,
    ...source,
    drillId: drillIds.includes(source.drillId) ? source.drillId : DEFAULTS.drillId,
    count: typeof source.count === "number" && source.count >= 0 ? source.count : DEFAULTS.count,
    autoplay: Boolean(source.autoplay),
    revealNotation: Boolean(source.revealNotation),
    tonalContext: Boolean(source.tonalContext),
    tonicPool: ["starter", "circle", "chromatic"].includes(source.tonicPool) ? source.tonicPool : DEFAULTS.tonicPool,
    noteMode,
    degrees: normalizeList(source.degrees, DEFAULTS.degrees, DEGREES.map(item => item.id)),
    noteNames: normalizeList(source.noteNames, DEFAULTS.noteNames, NOTE_NAMES),
    intervals: normalizeList(source.intervals, DEFAULTS.intervals, INTERVALS.map(item => item.id)),
    chords: normalizeList(source.chords, DEFAULTS.chords, CHORDS.map(item => item.id)),
    scales: normalizeList(source.scales, DEFAULTS.scales, SCALES.map(item => item.id)),
    progressions: normalizeList(source.progressions, DEFAULTS.progressions, PROGRESSIONS.map(item => item.id)),
    presentMode: ["audio","staff","both"].includes(source.presentMode) ? source.presentMode : DEFAULTS.presentMode,
    spellingIntervals: normalizeList(source.spellingIntervals, DEFAULTS.spellingIntervals, SPELLING_INTERVALS.map(item => item.id)),
    spellingChords: normalizeList(source.spellingChords, DEFAULTS.spellingChords, CHORDS.map(item => item.id)),
    readingClefs: normalizeList(source.readingClefs, DEFAULTS.readingClefs, CLEFS.map(item => item.id))
  }
}

function App() {
  const [settings, setSettings] = useState(() => {
    try { return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) }
    catch { return DEFAULTS }
  })
  const [view, setView] = useState("setup")
  const [question, setQuestion] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [audioState, setAudioState] = useState("loading")
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0, best: 0, mistakes: [] })
  const [run, setRun] = useState({ index: 0, total: DEFAULTS.count || 10, correct: 0 })
  const [phase, setPhase] = useState("idle")
  const [showOptions, setShowOptions] = useState(false)
  const notationRef = useRef(null)
  const instrumentRef = useRef(null)
  const fxRef = useRef(null)
  const audioReadyRef = useRef(false)
  const loadingAudioRef = useRef(null)
  const lastQuestionRef = useRef({})
  const timeoutRef = useRef(null)
  const stoppedRunRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const container = notationRef.current
    if (!container) return
    const showNotation = question?.notation?.sightRead || (phase === "feedback" && settings.revealNotation)
    const draw = () => renderNotation(container, question, showNotation)
    draw()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(draw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [question, phase, settings.revealNotation])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  useEffect(() => {
    loadAudioAssets().catch(() => setAudioState("error"))
  }, [])

  useEffect(() => {
    const warm = () => {
      ensureAudio().catch(() => setAudioState("error"))
    }
    window.addEventListener("pointerdown", warm, { once: true })
    window.addEventListener("keydown", warm, { once: true })
    return () => {
      window.removeEventListener("pointerdown", warm)
      window.removeEventListener("keydown", warm)
    }
  }, [])

  useEffect(() => {
    const onKey = event => {
      if (event.target.closest("input") || event.target.closest("select")) return
      if (view !== "practice") return
      if (event.key === " ") {
        event.preventDefault()
        replayPrompt()
      }
      if (event.key === "Enter") {
        event.preventDefault()
        replayTarget()
      }
      if (question?.usePiano && phase === "answering") {
        const pianoIdx = PIANO_KEYS.indexOf(event.key.toLowerCase())
        if (pianoIdx >= 0) {
          const note = PIANO_WHITE[pianoIdx]
          submitAnswer(event.shiftKey && PIANO_BLACK_MAP[note] ? normNote(PIANO_BLACK_MAP[note]) : normNote(note))
          return
        }
      }
      const index = KEY_HINTS.indexOf(event.key)
      if (index >= 0 && phase === "answering" && question?.answers[index]) {
        submitAnswer(question.answers[index].id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [view, phase, question])

  const summary = useMemo(() => {
    if (settings.drillId === "notes") {
      return settings.noteMode === "functional"
        ? `Notes · functional · ${settings.degrees.length} items`
        : `Notes · absolute · ${settings.noteNames.length} items`
    }
    if (settings.drillId === "intervals") return `Intervals · ${settings.intervals.length} items`
    if (settings.drillId === "chords") return `Chords · ${settings.chords.length} items`
    if (settings.drillId === "scales") return `Scales · ${settings.scales.length} items`
    if (settings.drillId === "spelling") return `Spelling · ${settings.spellingIntervals.length} intervals · ${settings.spellingChords.length} chords`
    if (settings.drillId === "reading") return `Reading · ${settings.readingClefs.length} clefs`
    return `Progressions · ${settings.progressions.length} items`
  }, [settings])

  function currentDrill() {
    return DRILLS.find(item => item.id === settings.drillId) || DRILLS[0]
  }

  function tonicChoices() {
    if (settings.tonicPool === "circle") return ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]
    if (settings.tonicPool === "chromatic") return NOTE_NAMES
    return ["C", "D", "E", "F", "G", "A"]
  }

  async function loadAudioAssets() {
    if (audioReadyRef.current) return
    if (loadingAudioRef.current) return loadingAudioRef.current
    loadingAudioRef.current = (async () => {
      setAudioState("loading")
      const limiter = new Tone.Limiter(-4).toDestination()
      const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.12 })
      const compressor = new Tone.Compressor({ threshold: -22, ratio: 3, attack: 0.01, release: 0.18 })
      reverb.connect(compressor)
      compressor.connect(limiter)
      const sampler = new Tone.Sampler({
        urls: {
          A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
          A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
          A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3"
        },
        release: 1.3,
        baseUrl: "https://tonejs.github.io/audio/salamander/"
      }).connect(reverb)
      await Tone.loaded()
      instrumentRef.current = sampler
      fxRef.current = { limiter, reverb, compressor }
      audioReadyRef.current = true
      setAudioState("ready")
    })().finally(() => {
      loadingAudioRef.current = null
    })
    return loadingAudioRef.current
  }

  async function ensureAudio() {
    await loadAudioAssets()
    await Tone.start()
  }

  function randomItem(items) { return items[Math.floor(Math.random() * items.length)] }

  function pickItem(items, key) {
    const previous = lastQuestionRef.current[key]
    if (items.length > 1 && previous != null) {
      const filtered = items.filter(item => item !== previous)
      if (filtered.length) return randomItem(filtered)
    }
    return randomItem(items)
  }

  function fitMidi(midi, low = 48, high = 80) {
    let value = midi
    while (value < low) value += 12
    while (value > high) value -= 12
    return value
  }

  function tonicMidi(name) { return fitMidi(48 + NOTE_TO_PC[name], 48, 59) }

  function chordNotes(root, intervals) {
    const base = fitMidi(root, 45, 56)
    return intervals.map((interval, index) => fitMidi(base + interval + (index > 0 ? 12 : 0), 48, 82))
  }

  function chordQuestionVoicing(root, item) {
    const pitchClasses = [...new Set(item.intervals.map(value => ((value % 12) + 12) % 12))]
    const voices = [fitMidi(root - 12, 38, 48)]
    const priority = [0, 3, 4, 10, 11, 2, 1, 5, 6, 7, 8, 9]
    const chosen = priority.filter(pc => pitchClasses.includes(pc)).slice(0, 3)
    while (chosen.length < 3 && pitchClasses.length) {
      const next = pitchClasses[chosen.length % pitchClasses.length]
      if (!chosen.includes(next)) chosen.push(next)
      else break
    }
    chosen.forEach((pc, index) => {
      const octaveOffset = index === 0 ? 12 : 24
      voices.push(fitMidi(root + pc + octaveOffset, 50, 72))
    })
    return voices
  }

  function normalizedScaleNotes(root, semitones) {
    const pool = [...new Set([0, ...semitones, 12])].sort((a, b) => a - b)
    const picked = []
    for (let index = 0; index < 8; index += 1) {
      const position = index * (pool.length - 1) / 7
      const note = pool[Math.round(position)]
      picked.push(fitMidi(root + note, 52, 79))
    }
    return picked
  }

  function contextChord(root, upperIntervals) {
    const bass = fitMidi(root - 12, 36, 47)
    return [bass, ...upperIntervals.map(interval => fitMidi(root + interval, 50, 69))]
  }

  function romanOffset(symbol) {
    const table = { I:0, i:0, ii:2, II:2, iii:4, III:4, IV:5, iv:5, V:7, vi:9, VI:9, bVI:8, bVII:10 }
    return table[symbol] ?? 0
  }

  function cadence(tonic) {
    if (!settings.tonalContext) return []
    return [
      { type: "chord", notes: contextChord(tonic, [19, 23, 28]), role: "context" },
      { type: "chord", notes: contextChord(tonic + 5, [21, 24, 28]), role: "context" },
      { type: "chord", notes: contextChord(tonic + 7, [22, 26, 29]), role: "context" },
      { type: "chord", notes: contextChord(tonic, [19, 23, 28]), role: "context" }
    ]
  }

  function buildQuestion() {
    const tonicName = randomItem(tonicChoices())
    const tonic = tonicMidi(tonicName)
    if (settings.drillId === "notes") {
      if (settings.noteMode === "absolute") {
        const notePool = settings.noteNames.filter(id => NOTE_NAMES.includes(id))
        const answerId = pickItem(notePool, "notes-absolute")
        lastQuestionRef.current["notes-absolute"] = answerId
        const midi = fitMidi(60 + NOTE_TO_PC[answerId], 52, 76)
        return {
          title: "Absolute Note", prompt: "Which note was it?", answerId, tonicName,
          answers: settings.noteNames.map(id => ({ id, label: id, subtitle: "note name" })),
          notation: { title: answerId, subtitle: midiName(midi), notes: [midi] },
          targetStart: 0, playback: [{ type: "note", midi, role: "target" }]
        }
      }
      const degreeId = pickItem(settings.degrees, "notes-functional")
      lastQuestionRef.current["notes-functional"] = degreeId
      const degree = DEGREES.find(item => item.id === degreeId) || DEGREES[0]
      const midi = fitMidi(tonic + degree.semitones + randomItem([12, 24]), 50, 79)
      return {
        title: "Functional Note", prompt: "Which scale degree was it?", answerId: degree.id, tonicName,
        answers: settings.degrees.map(id => { const item = DEGREES.find(entry => entry.id === id); return { id, label: item.label, subtitle: item.subtitle } }),
        notation: { title: `${degree.label} in ${tonicName}`, subtitle: midiName(midi), notes: [midi] },
        targetStart: cadence(tonic).length, playback: [...cadence(tonic), { type: "note", midi, role: "target" }]
      }
    }
    if (settings.drillId === "intervals") {
      const intervalId = pickItem(settings.intervals, "intervals")
      lastQuestionRef.current.intervals = intervalId
      const item = INTERVALS.find(entry => entry.id === intervalId) || INTERVALS[0]
      const start = fitMidi(tonic + randomItem([0, 2, 4, 5, 7, 9]) + 12, 52, 68)
      const end = fitMidi(start + item.semitones, 55, 81)
      return {
        title: "Interval", prompt: "Which interval was it?", answerId: item.id, tonicName,
        answers: settings.intervals.map(id => INTERVALS.find(entry => entry.id === id)),
        notation: { title: item.label, subtitle: `${midiName(start)} → ${midiName(end)}`, notes: [start, end] },
        targetStart: 0, playback: [{ type: "note", midi: start, role: "target" }, { type: "note", midi: end, role: "target", targetTail: true }]
      }
    }
    if (settings.drillId === "chords") {
      const chordId = pickItem(settings.chords, "chords")
      lastQuestionRef.current.chords = chordId
      const item = CHORDS.find(entry => entry.id === chordId) || CHORDS[0]
      const root = fitMidi(tonic, 47, 52)
      const voicing = chordQuestionVoicing(root, item)
      return {
        title: "Chord Quality", prompt: "Which chord quality was it?", answerId: item.id, tonicName,
        answers: settings.chords.map(id => CHORDS.find(entry => entry.id === id)),
        notation: { title: item.label, subtitle: item.subtitle, notes: voicing, chord: true },
        targetStart: 0, playback: [{ type: "chord", notes: voicing, role: "target" }]
      }
    }
    if (settings.drillId === "scales") {
      const scaleId = pickItem(settings.scales, "scales")
      lastQuestionRef.current.scales = scaleId
      const item = SCALES.find(entry => entry.id === scaleId) || SCALES[0]
      const root = fitMidi(tonic + 12, 50, 62)
      const notes = normalizedScaleNotes(root, item.semitones)
      return {
        title: "Scale / Mode", prompt: "Which scale or mode was it?", answerId: item.id, tonicName,
        answers: settings.scales.map(id => SCALES.find(entry => entry.id === id)),
        notation: { title: `${tonicName} ${item.label}`, subtitle: item.subtitle, notes },
        targetStart: 1, playback: [{ type: "note", midi: root, role: "context" }, ...notes.map((midi, index) => ({ type: "note", midi, short: true, role: "target", targetTail: index === notes.length - 1 }))]
      }
    }
    if (settings.drillId === "spelling") {
      const chordPool = settings.spellingChords.map(id => CHORDS.find(c => c.id === id)).filter(Boolean)
      const chord = pickItem(chordPool, "spelling-chord")
      lastQuestionRef.current["spelling-chord"] = chord
      const intervalPool = settings.spellingIntervals.map(id => SPELLING_INTERVALS.find(i => i.id === id)).filter(Boolean)
      const interval = pickItem(intervalPool, "spelling-interval")
      lastQuestionRef.current["spelling-interval"] = interval
      const rootPc = NOTE_TO_PC[tonicName]
      const answerPc = ((rootPc + interval.semitones) % 12 + 12) % 12
      const answerNote = NOTE_NAMES[answerPc]
      const midi = fitMidi(57 + answerPc, 57, 68)
      return {
        title: "Chord Spelling", prompt: `What's the ${interval.label} of ${tonicName}${chord.label}?`,
        answerId: normNote(answerNote), tonicName, usePiano: true,
        answers: PIANO_NOTES.map(n => ({ id: n, label: n, subtitle: "" })),
        notation: { title: `${answerNote}`, subtitle: `${interval.label} of ${tonicName}${chord.label}`, notes: [midi] },
        targetStart: 0, playback: [{ type: "note", midi, role: "target" }]
      }
    }
    if (settings.drillId === "reading") {
      const clefIds = settings.readingClefs.length ? settings.readingClefs : ["treble"]
      const clefId = randomItem(clefIds)
      const clef = CLEFS.find(c => c.id === clefId) || CLEFS[0]
      const midi = clef.midiLow + Math.floor(Math.random() * (clef.midiHigh - clef.midiLow))
      const pc = ((midi % 12) + 12) % 12
      const answerNote = NOTE_NAMES[pc]
      return {
        title: "Sight Reading", prompt: "Name this note",
        answerId: normNote(answerNote), tonicName: "", usePiano: true,
        answers: PIANO_NOTES.map(n => ({ id: n, label: n, subtitle: "" })),
        notation: { title: answerNote, subtitle: midiName(midi), notes: [midi], clef: clef.vexId, sightRead: true },
        targetStart: 0, playback: [{ type: "note", midi, role: "target" }]
      }
    }
    const progressionId = pickItem(settings.progressions, "progressions")
    lastQuestionRef.current.progressions = progressionId
    const item = PROGRESSIONS.find(entry => entry.id === progressionId) || PROGRESSIONS[0]
    const progressionEvents = item.steps.map(([roman, chordId]) => {
      const chord = CHORDS.find(entry => entry.id === chordId) || { intervals: [0, 4, 7] }
      return { type: "chord", notes: chordNotes(tonic + romanOffset(roman), chord.intervals), role: "target" }
    })
    return {
      title: "Progression", prompt: "Which progression was it?", answerId: item.id, tonicName,
      answers: settings.progressions.map(id => PROGRESSIONS.find(entry => entry.id === id)),
      notation: { title: item.label, subtitle: item.subtitle, notes: progressionEvents.flatMap(event => event.notes.slice(0, 3)) },
      targetStart: 0, playback: progressionEvents
    }
  }

  function eventTiming(event) {
    if (event.type === "chord") return { duration: 0.92, gap: event.role === "context" ? 0.18 : 0.24 }
    if (event.short) return { duration: 0.26, gap: 0.08 }
    return { duration: 0.56, gap: 0.16 }
  }

  function shouldPlayAudio() {
    return settings.presentMode !== "staff"
  }

  function playEvents(events) {
    if (!instrumentRef.current || !shouldPlayAudio()) return
    let time = Tone.now() + 0.02
    events.forEach(event => {
      const { duration, gap } = eventTiming(event)
      if (event.type === "note") instrumentRef.current.triggerAttackRelease(Tone.Frequency(event.midi, "midi"), duration, time, event.short ? 0.78 : 0.88)
      if (event.type === "chord") {
        if (typeof instrumentRef.current.releaseAll === "function") {
          instrumentRef.current.triggerAttackRelease(event.notes.map(midi => Tone.Frequency(midi, "midi")), duration, time, 0.76)
        } else {
          event.notes.forEach((midi, index) => instrumentRef.current.triggerAttackRelease(Tone.Frequency(midi, "midi"), duration, time + index * 0.008, 0.72 + Math.random() * 0.12))
        }
      }
      time += duration + gap
    })
  }

  function promptParts(currentQuestion) {
    if (!currentQuestion) return { contextEvents: [], targetEvents: [] }
    const splitAt = currentQuestion.targetStart ?? 0
    return { contextEvents: currentQuestion.playback.slice(0, splitAt), targetEvents: currentQuestion.playback.slice(splitAt) }
  }

  function playWrongThenCorrect(choiceId) {
    if (!question) return
    const time = Tone.now() + 0.02
    const wrong = question.answers.find(item => item.id === choiceId)
    const correct = question.answers.find(item => item.id === question.answerId)
    if (!wrong || !correct) return
    if (settings.drillId === "notes" && settings.noteMode === "absolute") {
      const wrongMidi = fitMidi(60 + NOTE_TO_PC[wrong.id], 52, 76)
      const rightMidi = fitMidi(60 + NOTE_TO_PC[correct.id], 52, 76)
      instrumentRef.current.triggerAttackRelease(Tone.Frequency(wrongMidi, "midi"), "4n", time, 0.7)
      instrumentRef.current.triggerAttackRelease(Tone.Frequency(rightMidi, "midi"), "4n", time + 0.5, 0.9)
    }
  }

  async function startRun() {
    clearTimeout(timeoutRef.current)
    try { await ensureAudio() } catch { setAudioState("error"); return }
    const total = settings.count === 0 ? 0 : settings.count
    setRun({ index: 0, total, correct: 0 })
    setStats(current => ({ ...current, streak: 0, mistakes: [] }))
    setFeedback(null)
    stoppedRunRef.current = null
    setView("practice")
    nextQuestion(1, total)
  }

  function nextQuestion(explicitIndex = null, explicitTotal = null) {
    clearTimeout(timeoutRef.current)
    const total = explicitTotal ?? run.total
    const nextIndex = explicitIndex ?? (run.index + 1)
    if (total !== 0 && nextIndex > total) {
      setView("results")
      setPhase("idle")
      setQuestion(null)
      return
    }
    const next = buildQuestion()
    const { contextEvents, targetEvents } = promptParts(next)
    setQuestion(next)
    setFeedback(null)
    setPhase("prepare")
    setRun(current => ({ ...current, total, index: nextIndex }))
    const skipAudio = !shouldPlayAudio()
    if (skipAudio && (next.usePiano || next.notation?.sightRead)) {
      timeoutRef.current = setTimeout(() => setPhase("answering"), 300)
      return
    }
    timeoutRef.current = setTimeout(() => {
      if (contextEvents.length) {
        setPhase("context")
        playEvents(contextEvents)
        const ctxDur = skipAudio ? 200 : estimateDuration(contextEvents) + 160
        timeoutRef.current = setTimeout(() => {
          setPhase("target")
          playEvents(targetEvents)
          const tgtDur = skipAudio ? 200 : estimateDuration(targetEvents) + 120
          timeoutRef.current = setTimeout(() => setPhase("answering"), tgtDur)
        }, ctxDur)
        return
      }
      setPhase("target")
      playEvents(targetEvents)
      const tgtDur = skipAudio ? 200 : estimateDuration(targetEvents) + 120
      timeoutRef.current = setTimeout(() => setPhase("answering"), tgtDur)
    }, 220)
  }

  function estimateDuration(events) {
    return Math.max(420, Math.round(events.reduce((sum, event) => {
      const { duration, gap } = eventTiming(event)
      return sum + (duration + gap) * 1000
    }, 0)))
  }

  function replayPrompt() {
    if (!question || phase === "prepare") return
    playEvents(question.playback)
  }

  function replayTarget() {
    if (!question || phase === "prepare") return
    playEvents(promptParts(question).targetEvents)
  }

  function feedbackDelay(currentQuestion, correct) {
    const targetMs = estimateDuration(promptParts(currentQuestion).targetEvents)
    const holdMs = settings.drillId === "scales" ? 2200 : settings.drillId === "progressions" ? 1800 : settings.drillId === "chords" ? 1500 : 1200
    return targetMs + holdMs + (correct ? 0 : 500)
  }

  function submitAnswer(answerId) {
    if (!question || phase !== "answering") return
    const correct = answerId === question.answerId
    setPhase("feedback")
    setFeedback({ answerId, correct })
    setStats(current => {
      const nextCorrect = current.correct + (correct ? 1 : 0)
      const nextTotal = current.total + 1
      const nextStreak = correct ? current.streak + 1 : 0
      const nextMistakes = correct ? current.mistakes : [...current.mistakes, { kind: settings.drillId, expectedId: question.answerId, expectedLabel: question.answers.find(item => item.id === question.answerId)?.label || question.answerId }]
      return { total: nextTotal, correct: nextCorrect, streak: nextStreak, best: Math.max(current.best, nextStreak), mistakes: nextMistakes }
    })
    setRun(current => ({ ...current, correct: current.correct + (correct ? 1 : 0) }))
    if (correct) replayTarget()
    else { playWrongThenCorrect(answerId); timeoutRef.current = setTimeout(() => replayTarget(), 520) }
    if (settings.autoplay) timeoutRef.current = setTimeout(() => nextQuestion(), feedbackDelay(question, correct))
  }

  function stopRun() {
    clearTimeout(timeoutRef.current)
    stoppedRunRef.current = { ...run, stats: { ...stats } }
    setView("results")
    setQuestion(null)
    setPhase("idle")
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
  const practiceLabel = run.total === 0 ? `${run.index}` : `${Math.min(run.index, run.total)}/${run.total}`
  const progressWidth = run.total === 0 ? 10 : Math.min(100, (run.index / Math.max(1, run.total)) * 100)
  const activeAnswerCount = question?.answers?.length || 0
  const answerCols = activeAnswerCount <= 3 ? "grid-cols-1 sm:grid-cols-3" : activeAnswerCount <= 6 ? "grid-cols-2 sm:grid-cols-3" : activeAnswerCount <= 9 ? "grid-cols-3 lg:grid-cols-3" : activeAnswerCount <= 12 ? "grid-cols-3 lg:grid-cols-4" : "grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
  const selectedDrill = currentDrill()
  const startDisabled = audioState === "loading"
  const startLabel = audioState === "loading" ? "Loading..." : audioState === "error" ? "Retry" : "Start"
  const weakSpots = Object.values(stats.mistakes.reduce((acc, item) => {
    const key = item.expectedId
    if (!acc[key]) acc[key] = { ...item, count: 0 }
    acc[key].count += 1
    return acc
  }, {})).sort((a, b) => b.count - a.count)

  function applyQuickSet(mode) {
    setSettings(current => {
      if (current.drillId === "notes") {
        return current.noteMode === "functional" ? { ...current, degrees: [...QUICK_SETS.notesFunctional[mode]] } : { ...current, noteNames: [...QUICK_SETS.notesAbsolute[mode]] }
      }
      if (current.drillId === "intervals") return { ...current, intervals: [...QUICK_SETS.intervals[mode]] }
      if (current.drillId === "chords") return { ...current, chords: [...QUICK_SETS.chords[mode]] }
      if (current.drillId === "scales") return { ...current, scales: [...QUICK_SETS.scales[mode]] }
      if (current.drillId === "spelling") return { ...current, spellingIntervals: [...QUICK_SETS.spellingIntervals[mode]], spellingChords: [...QUICK_SETS.spellingChords[mode]] }
      if (current.drillId === "reading") return { ...current, readingClefs: [...QUICK_SETS.readingClefs[mode]] }
      return { ...current, progressions: [...QUICK_SETS.progressions[mode]] }
    })
  }

  const activeQuickSet = (() => {
    if (settings.drillId === "notes") {
      const current = settings.noteMode === "functional" ? settings.degrees : settings.noteNames
      const sets = settings.noteMode === "functional" ? QUICK_SETS.notesFunctional : QUICK_SETS.notesAbsolute
      if (sameMembers(current, sets.basic)) return "basic"
      if (sameMembers(current, sets.essentials)) return "essentials"
      if (sameMembers(current, sets.all)) return "all"
      return null
    }
    if (settings.drillId === "spelling") {
      const ci = settings.spellingIntervals; const si = QUICK_SETS.spellingIntervals
      if (sameMembers(ci, si.basic)) return "basic"
      if (sameMembers(ci, si.essentials)) return "essentials"
      if (sameMembers(ci, si.all)) return "all"
      return null
    }
    if (settings.drillId === "reading") {
      const cc = settings.readingClefs; const sc = QUICK_SETS.readingClefs
      if (sameMembers(cc, sc.basic)) return "basic"
      if (sameMembers(cc, sc.essentials)) return "essentials"
      if (sameMembers(cc, sc.all)) return "all"
      return null
    }
    const map = { intervals: QUICK_SETS.intervals, chords: QUICK_SETS.chords, scales: QUICK_SETS.scales, progressions: QUICK_SETS.progressions }
    const current = settings[settings.drillId]
    const sets = map[settings.drillId]
    if (!sets) return null
    if (sameMembers(current, sets.basic)) return "basic"
    if (sameMembers(current, sets.essentials)) return "essentials"
    if (sameMembers(current, sets.all)) return "all"
    return null
  })()

  const isWaiting = phase === "prepare" || phase === "context" || phase === "target"

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink text-white overflow-hidden">
      <div className="noise" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 sm:px-6 md:px-8" style={{background:'linear-gradient(180deg,rgba(8,11,20,0.95) 0%,rgba(8,11,20,0.8) 100%)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{background:'linear-gradient(135deg,rgba(129,140,248,0.2),rgba(52,211,153,0.15))'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] sm:text-2xl">
            <span className="gradient-text">ChordVibe</span>
          </h1>
        </div>
        <span className="glass rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent">{selectedDrill.label}</span>
      </header>

      {view === "setup" && (
        <main className="relative flex flex-1 flex-col">
          <nav className="relative z-10 border-b border-white/[0.04]">
            <div className="mx-auto flex max-w-6xl gap-0 overflow-x-auto px-2 sm:px-4">
              {DRILLS.map(drill => (
                <button
                  key={drill.id}
                  onClick={() => setSettings(current => ({ ...current, drillId: drill.id }))}
                  className={`group relative flex-shrink-0 cursor-pointer px-4 py-3.5 text-center transition-all sm:px-6 sm:py-4 ${settings.drillId === drill.id ? "tab-active text-white" : "text-mist hover:text-mist"}`}
                >
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.12em] sm:text-base">{drill.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 md:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <div className="flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent/80">{selectedDrill.subtitle}</p>
                <h2 className="mt-3 font-display text-5xl font-bold uppercase leading-[0.9] tracking-wide sm:text-6xl lg:text-7xl gradient-text">{selectedDrill.label}</h2>
                <p className="mt-4 font-mono text-sm leading-relaxed text-mist/70">{summary}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    settings.count === 0 ? "endless" : `${settings.count}q`,
                    settings.tonalContext ? "context" : "no ctx",
                    settings.autoplay ? "auto" : "manual",
                    settings.revealNotation ? "notation" : "ear only"
                  ].map(tag => (
                    <span key={tag} className="glass rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-mist">{tag}</span>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-mist/70">Quick Select</p>
                  <div className="flex gap-2">
                    {["basic", "essentials", "all"].map(id => (
                      <button
                        key={id}
                        onClick={() => applyQuickSet(id)}
                        className={`cursor-pointer rounded-lg px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em] transition-all ${activeQuickSet === id ? "bg-accent text-white shadow-lg shadow-accent/25" : "glass text-mist hover:text-white hover:bg-white/[0.06]"}`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:w-60">
                <button onClick={() => setShowOptions(true)} className="group flex-1 cursor-pointer glass rounded-2xl px-5 py-5 text-left transition-all hover:bg-white/[0.06] hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist/80">Setup</p>
                  <p className="mt-1.5 font-display text-2xl font-bold uppercase tracking-wide">Options</p>
                </button>
                <button onClick={startRun} disabled={startDisabled} className="start-btn flex-1 cursor-pointer rounded-2xl px-5 py-6 text-left disabled:cursor-wait disabled:opacity-50">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-play">{startDisabled ? "Loading" : "Ready"}</p>
                  <p className="mt-1.5 font-display text-3xl font-bold uppercase tracking-wide">{startLabel}</p>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {view === "practice" && (
        <main className="relative flex flex-1 flex-col">
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 md:px-6">
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">{selectedDrill.label}</span>
                <span className="font-mono text-xs tabular-nums text-mist/80">{practiceLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={replayPrompt} className="glass cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-mist transition hover:text-white hover:bg-white/[0.06]">
                  <span className="hidden sm:inline">Replay </span>
                  <span className="text-accent/70">␣</span>
                </button>
                <button onClick={stopRun} className="glass cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-mist transition hover:text-coral hover:bg-coral/5">Stop</button>
              </div>
            </div>

            <div className="mx-auto h-[3px] w-full max-w-2xl overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressWidth}%`, background: 'linear-gradient(90deg, #818CF8, #34D399)' }} />
            </div>

            <div className={`glass-strong mt-3 rounded-2xl p-4 text-center sm:mt-4 sm:p-5 ${isWaiting ? "listening-pulse" : ""}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent/70">{question?.title || selectedDrill.label}</p>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-mist/30">
                {phase === "prepare" && "ready"}
                {phase === "context" && "context"}
                {phase === "target" && "target"}
                {phase === "answering" && "answer"}
                {phase === "feedback" && "feedback"}
              </div>
              <h2 className="mt-2 font-display text-xl font-bold uppercase leading-tight tracking-wide sm:text-2xl md:text-3xl">
                {phase === "prepare" && "Listen..."}
                {phase === "context" && "Hear The Key"}
                {phase === "target" && "Hear The Question"}
                {phase === "answering" && question?.prompt}
                {phase === "feedback" && <span className={feedback?.correct ? "gradient-text" : "text-coral"}>{question?.notation.title}</span>}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-mist/80 sm:text-xs">
                {phase === "prepare" && "Ready."}
                {phase === "context" && "Cadence only. Hold the key in your ear."}
                {phase === "target" && "Question only. This is the part you identify."}
                {phase === "answering" && "One answer. Then the next rep."}
                {phase === "feedback" && (feedback?.correct ? "Locked in." : `Correct: ${question?.notation.title}`)}
              </p>

              {(settings.presentMode === "staff" || settings.presentMode === "both" || question?.notation?.sightRead) && (
                <div className="mx-auto mt-3 max-w-lg overflow-hidden rounded-xl border border-[#d4c48a]/20 bg-sand shadow-lg shadow-black/20">
                  <div ref={notationRef} className="h-[100px] w-full sm:h-[120px] md:h-[140px]" />
                </div>
              )}
              {settings.presentMode === "audio" && !question?.notation?.sightRead && (
                <div className="mx-auto mt-3 max-w-lg glass rounded-xl p-6 text-center">
                  <span className="text-3xl">🎧</span>
                  <p className="mt-2 font-mono text-xs text-mist">Listen carefully</p>
                </div>
              )}
            </div>

            {question?.usePiano ? (
              <div className="mt-3 fade-up">
                <PianoKeyboard onNote={id => submitAnswer(id)} feedback={feedback} correctId={question?.answerId} disabled={phase !== "answering"} />
              </div>
            ) : (
              <div className={`mt-3 grid gap-1.5 sm:gap-2 ${answerCols}`}>
                {(question?.answers || []).map((answer, index) => {
                  const isCorrect = feedback && answer.id === question.answerId
                  const isWrong = feedback && !feedback.correct && answer.id === feedback.answerId
                  let extra = "glass"
                  if (isCorrect) extra = "correct-glow border-play/50 bg-play/10"
                  if (isWrong) extra = "wrong-glow border-coral/50 bg-coral/10"
                  return (
                    <button
                      key={answer.id}
                      disabled={phase !== "answering"}
                      onClick={() => submitAnswer(answer.id)}
                      className={`answer-btn fade-up cursor-pointer rounded-xl ${extra} min-h-[48px] px-3 py-2.5 text-left sm:px-4 sm:py-3 ${phase === "answering" ? "hover:bg-white/[0.06] hover:shadow-lg hover:shadow-accent/5" : ""} disabled:cursor-default`}
                      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block truncate font-display text-base font-semibold uppercase leading-tight sm:text-lg">{answer.label}</span>
                          <span className="mt-0.5 block truncate font-mono text-[10px] leading-tight text-mist/80 sm:text-xs">{answer.subtitle}</span>
                        </div>
                        {KEY_HINTS[index] && <span className="hidden flex-shrink-0 font-mono text-[10px] text-accent/50 sm:block">{KEY_HINTS[index]}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {view === "results" && (
        <main className="relative flex flex-1 items-center justify-center px-4 py-8">
          <div className="relative z-10 w-full max-w-2xl fade-up">
            <div className="glass-strong rounded-2xl p-6 text-center sm:p-8 md:p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent/70">
                {stoppedRunRef.current ? "Session Stopped" : "Set Complete"}
              </p>
              <h2 className="mt-4 font-display text-7xl font-bold uppercase leading-none md:text-8xl">
                <span className="gradient-text">{run.correct}</span>
                <span className="text-accent/50 mx-1">/</span>
                <span className="text-white/40">{run.total === 0 ? run.index : (stoppedRunRef.current ? run.index : run.total)}</span>
              </h2>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  ["Accuracy", `${accuracy}%`],
                  ["Streak", String(stats.best)],
                  ["Questions", String(stats.total)]
                ].map(([label, value]) => (
                  <div key={label} className="glass rounded-xl px-3 py-4 sm:px-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist/70">{label}</p>
                    <p className="mt-2 font-display text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
                  </div>
                ))}
              </div>

              {weakSpots.length > 0 && (
                <div className="mt-8 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-coral/60">Weak Spots</p>
                  <div className="mt-3 grid gap-2">
                    {weakSpots.slice(0, 5).map((item, index) => (
                      <div key={`${item.expectedId}-${index}`} className="glass flex items-center justify-between rounded-xl px-4 py-3">
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist/70">{item.kind}</span>
                          <span className="ml-2 font-display text-base font-semibold uppercase">{item.expectedLabel}</span>
                        </div>
                        <span className="font-mono text-sm text-coral/80">{item.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={startRun} disabled={startDisabled} className="start-btn cursor-pointer rounded-xl px-8 py-4 font-display text-xl font-bold uppercase tracking-wide disabled:cursor-wait disabled:opacity-50">Again</button>
                <button onClick={() => { setView("setup"); setQuestion(null); setFeedback(null); stoppedRunRef.current = null }} className="glass cursor-pointer rounded-xl px-6 py-4 font-display text-lg uppercase tracking-wide transition hover:bg-white/[0.06]">Options</button>
              </div>
            </div>
          </div>
        </main>
      )}

      {showOptions && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4" style={{background:'rgba(8,11,20,0.85)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}} onClick={e => { if (e.target === e.currentTarget) setShowOptions(false) }}>
          <div className="glass-strong my-4 w-full max-w-2xl rounded-2xl p-5 shadow-2xl shadow-black/40 sm:p-6 md:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent/70">Options</p>
                <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-wide gradient-text sm:text-4xl">{selectedDrill.label}</h2>
              </div>
              <button onClick={() => setShowOptions(false)} className="glass cursor-pointer rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-mist/80 transition hover:text-white hover:bg-white/[0.06]">Close</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <SelectCard label="Count" value={String(settings.count)} onChange={value => setSettings(current => ({ ...current, count: Number(value) }))} options={[["5","5"],["10","10"],["20","20"],["0","Endless"]]} />
              <SelectCard label="Tonic Pool" value={settings.tonicPool} onChange={value => setSettings(current => ({ ...current, tonicPool: value }))} options={[["starter","Starter"],["circle","Circle"],["chromatic","Chromatic"]]} />
              {settings.drillId === "notes" && <SelectCard label="Recognition" value={settings.noteMode} onChange={value => setSettings(current => ({ ...current, noteMode: value }))} options={[["functional","Functional"],["absolute","Absolute"]]} />}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SelectCard label="Presentation" value={settings.presentMode} onChange={value => setSettings(current => ({ ...current, presentMode: value }))} options={[["both","Both (Audio + Staff)"],["audio","Audio Only"],["staff","Staff Only"]]} />
            </div>

            <div className="mt-4 grid gap-2">
              <ToggleCard label="Autoplay Next" checked={settings.autoplay} onChange={checked => setSettings(current => ({ ...current, autoplay: checked }))} />
              <ToggleCard label="Show Notation" checked={settings.revealNotation} onChange={checked => setSettings(current => ({ ...current, revealNotation: checked }))} />
              <ToggleCard label="Tonal Context" checked={settings.tonalContext} onChange={checked => setSettings(current => ({ ...current, tonalContext: checked }))} />
            </div>

            {settings.drillId === "notes" && settings.noteMode === "functional" && (
              <OptionGroup title="Degrees" items={DEGREES} selected={settings.degrees} onToggle={id => setSettings(current => ({ ...current, degrees: toggleList(current.degrees, id, DEGREES.map(item => item.id)) }))} />
            )}
            {settings.drillId === "notes" && settings.noteMode === "absolute" && (
              <OptionGroup title="Absolute Notes" items={NOTE_NAMES.map(id => ({ id, label: id, subtitle: "note name" }))} selected={settings.noteNames} onToggle={id => setSettings(current => ({ ...current, noteNames: toggleList(current.noteNames, id, NOTE_NAMES) }))} />
            )}
            {settings.drillId === "intervals" && (
              <OptionGroup title="Intervals" items={INTERVALS} selected={settings.intervals} onToggle={id => setSettings(current => ({ ...current, intervals: toggleList(current.intervals, id, INTERVALS.map(item => item.id)) }))} />
            )}
            {settings.drillId === "chords" && (
              <OptionGroup title="Chord Types" items={CHORDS} selected={settings.chords} onToggle={id => setSettings(current => ({ ...current, chords: toggleList(current.chords, id, CHORDS.map(item => item.id)) }))} />
            )}
            {settings.drillId === "scales" && (
              <OptionGroup title="Scales / Modes" items={SCALES} selected={settings.scales} onToggle={id => setSettings(current => ({ ...current, scales: toggleList(current.scales, id, SCALES.map(item => item.id)) }))} />
            )}
            {settings.drillId === "progressions" && (
              <OptionGroup title="Progressions" items={PROGRESSIONS} selected={settings.progressions} onToggle={id => setSettings(current => ({ ...current, progressions: toggleList(current.progressions, id, PROGRESSIONS.map(item => item.id)) }))} />
            )}
            {settings.drillId === "spelling" && (
              <>
                <OptionGroup title="Intervals to ask" items={SPELLING_INTERVALS} selected={settings.spellingIntervals} onToggle={id => setSettings(current => ({ ...current, spellingIntervals: toggleList(current.spellingIntervals, id, SPELLING_INTERVALS.map(item => item.id)) }))} />
                <OptionGroup title="Chord types" items={CHORDS} selected={settings.spellingChords} onToggle={id => setSettings(current => ({ ...current, spellingChords: toggleList(current.spellingChords, id, CHORDS.map(item => item.id)) }))} />
              </>
            )}
            {settings.drillId === "reading" && (
              <OptionGroup title="Clefs" items={CLEFS} selected={settings.readingClefs} onToggle={id => setSettings(current => ({ ...current, readingClefs: toggleList(current.readingClefs, id, CLEFS.map(item => item.id)) }))} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SelectCard({ label, value, onChange, options }) {
  return (
    <label className="glass block rounded-xl p-3">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-mist/70">{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} className="w-full cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 pr-8 font-mono text-sm text-white outline-none transition focus:border-accent/40">
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>
  )
}

function ToggleCard({ label, checked, onChange }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition ${checked ? "glass border-accent/20" : "glass"} hover:bg-white/[0.04]`}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-[#818CF8]" />
      <span className="font-mono text-sm text-white/80">{label}</span>
    </label>
  )
}

function QuickSetBar({ onPick, active }) {
  return (
    <div className="flex flex-wrap gap-2">
      {["basic", "essentials", "all"].map(id => (
        <button
          key={id}
          onClick={() => onPick(id)}
          className={`cursor-pointer rounded-md px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${active === id ? "bg-accent text-white" : "bg-panel2 text-mist hover:text-white"}`}
        >
          {id}
        </button>
      ))}
    </div>
  )
}

function OptionGroup({ title, items, selected, onToggle }) {
  return (
    <div className="mt-5">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent/60">{title}</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {items.map(item => (
          <label key={item.id} className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition ${selected.includes(item.id) ? "bg-accent/10 border border-accent/25 shadow-sm shadow-accent/5" : "glass hover:bg-white/[0.04]"}`}>
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} className="h-3.5 w-3.5 cursor-pointer rounded accent-[#818CF8]" />
            <span className="min-w-0 truncate">
              <strong className="block truncate font-display text-sm font-semibold uppercase">{item.label}</strong>
              <small className="block truncate font-mono text-[9px] leading-tight text-mist/70">{item.subtitle}</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PianoKeyboard({ onNote, feedback, correctId, disabled }) {
  const whiteW = "calc((100% - 6px) / 7)"
  return (
    <div className="relative mx-auto w-full max-w-lg select-none" style={{ height: "120px" }}>
      <div className="flex h-full gap-[1px]">
        {PIANO_WHITE.map((note, i) => {
          const isCorrect = feedback && normNote(note) === correctId
          const isWrong = feedback && !feedback.correct && normNote(note) === normNote(feedback.answerId)
          let bg = "bg-white hover:bg-gray-100"
          if (isCorrect) bg = "bg-play/60"
          if (isWrong) bg = "bg-coral/60"
          return (
            <button
              key={note}
              disabled={disabled}
              onClick={() => onNote(normNote(note))}
              className={`${bg} relative cursor-pointer rounded-b-lg border border-white/20 text-ink transition-all active:bg-gray-200 disabled:cursor-default`}
              style={{ width: whiteW, minHeight: "44px" }}
            >
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-medium text-ink/40">{note}</span>
            </button>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[65%] gap-[1px] px-[2%]">
        {PIANO_WHITE.map((note, i) => {
          const black = PIANO_BLACK_MAP[note]
          if (!black) return <div key={`gap-${i}`} style={{ width: whiteW, flexShrink: 0 }} />
          const isCorrect = feedback && normNote(black) === correctId
          const isWrong = feedback && !feedback.correct && normNote(black) === normNote(feedback.answerId)
          let bg = "bg-ink hover:bg-gray-800"
          if (isCorrect) bg = "bg-play"
          if (isWrong) bg = "bg-coral"
          return (
            <div key={black} className="relative" style={{ width: whiteW, flexShrink: 0 }}>
              <button
                disabled={disabled}
                onClick={() => onNote(normNote(black))}
                className={`${bg} pointer-events-auto absolute right-[-28%] z-10 h-full w-[56%] cursor-pointer rounded-b-md border border-white/10 transition-all active:bg-gray-700 disabled:cursor-default`}
                style={{ minHeight: "44px" }}
              >
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-white/40">{black}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toggleList(list, id, fallback) {
  const next = list.includes(id) ? list.filter(value => value !== id) : [...list, id]
  return next.length ? next : [...fallback]
}

function sameMembers(left, right) {
  if (left.length !== right.length) return false
  const a = [...left].sort()
  const b = [...right].sort()
  return a.every((item, index) => item === b[index])
}

function midiName(midi) {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pc]}${octave}`
}

function renderNotation(container, question, visible) {
  if (!container) return
  container.innerHTML = ""
  if (!window.Vex?.Flow) return
  const VF = window.Vex.Flow
  const rect = container.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const noteGutter = Math.max(10, Math.round(width * 0.04))
  const staveX = noteGutter
  const staveWidth = Math.max(1, width - noteGutter * 2)
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()
  const fitSvg = () => {
    const svg = container.querySelector("svg")
    if (!svg) return
    svg.style.width = "100%"
    svg.style.height = "100%"
    svg.style.display = "block"
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
  }
  const isChord = question?.notation?.chord
  if (isChord) {
    const chordGutter = Math.max(24, Math.round(width * 0.08))
    const chordStaveX = chordGutter
    const chordStaveWidth = Math.max(1, width - chordGutter * 2)
    const topY = Math.round(height * 0.05)
    const gapY = Math.round(height * 0.42)
    const treble = new VF.Stave(chordStaveX, topY, chordStaveWidth)
    const bass = new VF.Stave(chordStaveX, topY + gapY, chordStaveWidth)
    treble.addClef("treble")
    bass.addClef("bass")
    treble.setContext(context).draw()
    bass.setContext(context).draw()
    const connectorLeft = new VF.StaveConnector(treble, bass)
    connectorLeft.setType(VF.StaveConnector.type.BRACE)
    connectorLeft.setContext(context).draw()
    const connectorRight = new VF.StaveConnector(treble, bass)
    connectorRight.setType(VF.StaveConnector.type.SINGLE_RIGHT)
    connectorRight.setContext(context).draw()
    if (!visible || !question) { fitSvg(); return }
    const notes = question.notation.notes || []
    const bassNoteMidi = notes[0]
    const upperNotes = notes.slice(1)
    const bassVoiceNote = vexNote([bassNoteMidi], "bass", VF)
    const trebleVoiceNote = vexNote(upperNotes, "treble", VF)
    const bassVoice = new VF.Voice({ num_beats: 1, beat_value: 4 }).addTickables([bassVoiceNote])
    const trebleVoice = new VF.Voice({ num_beats: 1, beat_value: 4 }).addTickables([trebleVoiceNote])
    new VF.Formatter().joinVoices([trebleVoice]).format([trebleVoice], Math.max(1, Math.round(chordStaveWidth * 0.72)))
    new VF.Formatter().joinVoices([bassVoice]).format([bassVoice], Math.max(1, Math.round(chordStaveWidth * 0.72)))
    trebleVoice.draw(context, treble)
    bassVoice.draw(context, bass)
    fitSvg()
    return
  }
  const staveY = Math.round(height * 0.15)
  const clefType = question?.notation?.clef || "treble"
  const stave = new VF.Stave(staveX, staveY, staveWidth)
  stave.addClef(clefType)
  stave.setContext(context).draw()
  if (!visible || !question) { fitSvg(); return }
  const groups = question.notation.notes.slice(0, 8).map(note => [note])
  const notes = groups.map(group => vexNote(group, clefType, VF))
  const voice = new VF.Voice({ num_beats: Math.max(1, notes.length), beat_value: 4 })
  voice.addTickables(notes)
  new VF.Formatter().joinVoices([voice]).format([voice], Math.max(1, Math.round(staveWidth * 0.74)))
  voice.draw(context, stave)
  fitSvg()
}

function vexNote(midis, clef, VF) {
  const keys = midis.map(midi => midiToVexKey(midi))
  const note = new VF.StaveNote({ clef, keys, duration: "q" })
  keys.forEach((key, index) => {
    if (key.includes("b/")) note.addModifier(new VF.Accidental("b"), index)
    if (key.includes("#/")) note.addModifier(new VF.Accidental("#"), index)
  })
  return note
}

function midiToVexKey(midi) {
  const note = vexNoteName(midi)
  const octave = Math.floor(midi / 12) - 1
  return `${note}/${octave}`
}

function vexNoteName(midi) {
  const names = ["c", "db", "d", "eb", "e", "f", "f#", "g", "ab", "a", "bb", "b"]
  return names[((midi % 12) + 12) % 12]
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
