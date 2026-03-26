const { useEffect, useMemo, useRef, useState } = React

const STORAGE_KEY = "chordvibe-ear-lab-v3"
const KEY_HINTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="]
const NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
const NOTE_TO_PC = Object.fromEntries(NOTE_NAMES.map((name, index) => [name, index]))

const DEGREE_DATA = [
  ["1", 0, "do / tonic"], ["b2", 1, "ra / flat second"], ["2", 2, "re / second"], ["b3", 3, "me / minor third"],
  ["3", 4, "mi / major third"], ["4", 5, "fa / fourth"], ["#4/b5", 6, "tritone"], ["5", 7, "sol / fifth"],
  ["b6", 8, "le / minor sixth"], ["6", 9, "la / major sixth"], ["b7", 10, "te / minor seventh"], ["7", 11, "ti / leading tone"]
].map(([id, semitones, subtitle]) => ({ id, label: id, semitones, subtitle }))

const INTERVAL_DATA = [
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

const DRILLS = [
  { id: "notes", label: "Notes", subtitle: "single note hearing" },
  { id: "intervals", label: "Intervals", subtitle: "distance" },
  { id: "chords", label: "Chords", subtitle: "quality" },
  { id: "scales", label: "Scales", subtitle: "mode color" },
  { id: "progressions", label: "Progressions", subtitle: "harmonic shape" }
]

const DEFAULTS = {
  drillId: "notes",
  count: 10,
  tempo: 76,
  autoplay: true,
  reveal: true,
  tonalContext: true,
  noteMode: "functional",
  tonicPool: "starter",
  degrees: DEGREE_DATA.map(x => x.id),
  noteNames: NOTE_NAMES,
  intervals: INTERVAL_DATA.map(x => x.id),
  chords: CHORDS.map(x => x.id),
  scales: SCALES.map(x => x.id),
  progressions: PROGRESSIONS.map(x => x.id)
}

function App() {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } } catch { return DEFAULTS }
  })
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 })
  const [question, setQuestion] = useState(null)
  const [answered, setAnswered] = useState(null)
  const [sessionIndex, setSessionIndex] = useState(0)
  const [showOptions, setShowOptions] = useState(false)
  const [audioState, setAudioState] = useState("tap to arm")
  const [samplerReady, setSamplerReady] = useState(false)
  const samplerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    drawNotation(canvasRef.current, question, answered && settings.reveal)
  }, [question, answered, settings.reveal])

  useEffect(() => {
    const onKey = event => {
      if (event.target.closest("input") || event.target.closest("select")) return
      if (event.key === " ") {
        event.preventDefault()
        replayPrompt()
      }
      if (event.key === "Enter") {
        event.preventDefault()
        replayTarget()
      }
      const index = KEY_HINTS.indexOf(event.key)
      if (index >= 0 && question?.answers[index]) submitAnswer(question.answers[index].id)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [question, answered, settings])

  async function ensureAudio() {
    await Tone.start()
    if (samplerRef.current) return
    setAudioState("loading piano")
    const sampler = new Tone.Sampler({
      urls: {
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3"
      },
      release: 1.4,
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination()
    await Tone.loaded()
    samplerRef.current = sampler
    setSamplerReady(true)
    setAudioState("piano ready")
  }

  function currentDrill() {
    return DRILLS.find(item => item.id === settings.drillId)
  }

  function tonicChoices() {
    return settings.tonicPool === "circle"
      ? ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]
      : settings.tonicPool === "chromatic"
      ? NOTE_NAMES
      : ["C", "D", "E", "F", "G", "A"]
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)]
  }

  function fitMidi(midi, low = 48, high = 80) {
    let value = midi
    while (value < low) value += 12
    while (value > high) value -= 12
    return value
  }

  function tonicMidi(name) {
    return fitMidi(48 + NOTE_TO_PC[name], 48, 59)
  }

  function chordNotes(root, intervals) {
    const base = fitMidi(root, 45, 56)
    return intervals.map((interval, index) => fitMidi(base + interval + (index > 0 ? 12 : 0), 48, 82))
  }

  function romanOffset(symbol) {
    const map = { I:0, i:0, bII:1, ii:2, II:2, bIII:3, III:4, iii:4, IV:5, iv:5, V:7, vi:9, VI:9, bVI:8, bVII:10 }
    return map[symbol] ?? 0
  }

  function buildQuestion() {
    const tonicName = randomItem(tonicChoices())
    const tonic = tonicMidi(tonicName)
    if (settings.drillId === "notes") {
      if (settings.noteMode === "absolute") {
        const id = randomItem(settings.noteNames)
        const midi = fitMidi(60 + NOTE_TO_PC[id], 52, 76)
        return {
          title: "Absolute Note",
          body: "Hear the note and identify the note name.",
          tonicName,
          answerId: id,
          answers: settings.noteNames.map(id => ({ id, label: id, subtitle: "note name" })),
          notation: { title: id, subtitle: midiName(midi), notes: [midi] },
          prompt: [{ type: "note", midi }]
        }
      }
      const degree = DEGREE_DATA.find(x => x.id === randomItem(settings.degrees))
      const midi = fitMidi(tonic + degree.semitones + randomItem([12, 24]), 50, 79)
      return {
        title: "Functional Note",
        body: "Hear the key, then identify the scale degree.",
        tonicName,
        answerId: degree.id,
        answers: settings.degrees.map(id => {
          const item = DEGREE_DATA.find(x => x.id === id)
          return { id, label: item.label, subtitle: item.subtitle }
        }),
        notation: { title: `${degree.label} in ${tonicName}`, subtitle: midiName(midi), notes: [midi] },
        prompt: [...buildCadence(tonic), { type: "note", midi }]
      }
    }
    if (settings.drillId === "intervals") {
      const interval = INTERVAL_DATA.find(x => x.id === randomItem(settings.intervals))
      const start = fitMidi(tonic + randomItem([0,2,4,5,7,9]) + 12, 52, 68)
      const end = fitMidi(start + interval.semitones, 55, 81)
      return {
        title: "Interval",
        body: "Hear both notes and identify the interval.",
        tonicName,
        answerId: interval.id,
        answers: settings.intervals.map(id => INTERVAL_DATA.find(x => x.id === id)),
        notation: { title: interval.label, subtitle: `${midiName(start)} → ${midiName(end)}`, notes: [start, end] },
        prompt: [...buildCadence(tonic), { type: "note", midi: start }, { type: "note", midi: end }]
      }
    }
    if (settings.drillId === "chords") {
      const chord = CHORDS.find(x => x.id === randomItem(settings.chords))
      const root = fitMidi(tonic + randomItem([0,2,4,5,7,9,10]), 45, 58)
      const notes = chordNotes(root, chord.intervals)
      return {
        title: "Chord Quality",
        body: "Hear the chord and identify the quality.",
        tonicName,
        answerId: chord.id,
        answers: settings.chords.map(id => CHORDS.find(x => x.id === id)),
        notation: { title: chord.label, subtitle: chord.subtitle, notes },
        prompt: [...buildCadence(tonic), { type: "chord", notes }]
      }
    }
    if (settings.drillId === "scales") {
      const scale = SCALES.find(x => x.id === randomItem(settings.scales))
      const root = fitMidi(tonic + 12, 50, 62)
      const notes = [...scale.semitones.map(s => fitMidi(root + s, 50, 80)), ...scale.semitones.slice(0, -1).reverse().map(s => fitMidi(root + s, 50, 80))]
      return {
        title: "Scale / Mode",
        body: "Hear the scale color and identify the mode or scale.",
        tonicName,
        answerId: scale.id,
        answers: settings.scales.map(id => SCALES.find(x => x.id === id)),
        notation: { title: `${tonicName} ${scale.label}`, subtitle: scale.subtitle, notes },
        prompt: [...buildCadence(tonic), ...notes.map(midi => ({ type: "note", midi, short: true }))]
      }
    }
    const progression = PROGRESSIONS.find(x => x.id === randomItem(settings.progressions))
    const events = progression.steps.map(([roman, chordId]) => {
      const chord = CHORDS.find(x => x.id === chordId) || { intervals: [0,4,7] }
      return { type: "chord", notes: chordNotes(tonic + romanOffset(roman), chord.intervals) }
    })
    return {
      title: "Progression",
      body: "Hear the loop and identify the progression.",
      tonicName,
      answerId: progression.id,
      answers: settings.progressions.map(id => PROGRESSIONS.find(x => x.id === id)),
      notation: { title: progression.label, subtitle: progression.subtitle, notes: events.flatMap(event => event.notes.slice(0, 3)) },
      prompt: [...buildCadence(tonic), ...events]
    }
  }

  function buildCadence(tonic) {
    if (!settings.tonalContext) return []
    return [
      { type: "chord", notes: chordNotes(tonic, [0,4,7]) },
      { type: "chord", notes: chordNotes(tonic + 5, [0,4,7]) },
      { type: "chord", notes: chordNotes(tonic + 7, [0,4,7,10]) },
      { type: "chord", notes: chordNotes(tonic, [0,4,7,11]) }
    ]
  }

  function playEvents(events) {
    if (!samplerRef.current) return
    let time = Tone.now() + 0.04
    events.forEach(event => {
      if (event.type === "note") samplerRef.current.triggerAttackRelease(Tone.Frequency(event.midi, "midi"), event.short ? "8n" : "4n", time, 0.9)
      if (event.type === "chord") event.notes.forEach(midi => samplerRef.current.triggerAttackRelease(Tone.Frequency(midi, "midi"), "2n", time, 0.84))
      time += event.short ? 0.18 : 0.56
    })
  }

  async function start() {
    await ensureAudio()
    const next = buildQuestion()
    setSessionIndex(value => value + 1)
    setAnswered(null)
    setQuestion(next)
    playEvents(next.prompt)
  }

  function replayPrompt() {
    if (question) playEvents(question.prompt)
  }

  function replayTarget() {
    if (question) playEvents([question.prompt[question.prompt.length - 1]])
  }

  function submitAnswer(id) {
    if (!question || answered) return
    const correct = id === question.answerId
    setAnswered({ id, correct })
    setStats(current => ({
      total: current.total + 1,
      correct: current.correct + (correct ? 1 : 0),
      streak: correct ? current.streak + 1 : 0
    }))
    if (settings.autoplay) {
      setTimeout(() => start(), correct ? 900 : 1300)
    }
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
  const progressLabel = `${sessionIndex} / ${settings.count === 0 ? "∞" : settings.count}`
  const answerList = question?.answers || []

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-5">
        <header className="rounded-none border border-line bg-panel px-5 py-4 md:px-7 md:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-gold">Ear Training</div>
              <h1 className="font-display text-5xl uppercase leading-none tracking-[0.04em] md:text-7xl">ChordVibe Ear Lab</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-mist md:text-base">Pick a drill. Pick the exact material. Press start. Repeat.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Audio", audioState],
                ["Drill", currentDrill().label],
                ["Streak", String(stats.streak)],
                ["Accuracy", `${accuracy}%`]
              ].map(([label, value]) => (
                <div key={label} className="min-w-[110px] border border-line bg-panel2 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-mist">{label}</div>
                  <div className="mt-3 text-xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-2 md:grid-cols-5">
          {DRILLS.map(drill => (
            <button
              key={drill.id}
              onClick={() => setSettings(current => ({ ...current, drillId: drill.id }))}
              className={`border px-4 py-3 text-left transition ${settings.drillId === drill.id ? "border-gold bg-[#2a281f]" : "border-line bg-panel hover:border-gold"}`}
            >
              <div className="text-xl font-semibold">{drill.label}</div>
              <div className="mt-1 text-xs text-mist">{drill.subtitle}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-none border border-line bg-panel px-4 py-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold">{currentDrill().label}</div>
            <div className="mt-1 text-sm text-mist">{question ? question.body : "Open options, choose the exact material, then start."}</div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={() => setShowOptions(true)} className="border border-line bg-panel2 px-4 py-3 hover:border-gold">Options</button>
            <button onClick={start} className="border border-gold bg-[#273449] px-5 py-3 font-display text-2xl uppercase tracking-[0.08em] hover:bg-[#31425b]">Start</button>
            <button onClick={replayPrompt} className="border border-line bg-panel2 px-4 py-3 hover:border-gold">Replay Prompt</button>
            <button onClick={replayTarget} className="border border-line bg-panel2 px-4 py-3 hover:border-gold">Replay Target</button>
            <button onClick={() => setAnswered({ id: question?.answerId, correct: true })} className="border border-line bg-panel2 px-4 py-3 hover:border-gold">Reveal</button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-4xl gap-4">
          <section className="border border-line bg-panel px-5 py-5 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gold">{question ? question.title : currentDrill().label}</div>
                <h2 className="mt-2 font-display text-5xl uppercase leading-none md:text-6xl">{question ? question.title : "Ready"}</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-mist">{question ? question.body : "Choose what you want to practice and press start."}</p>
              </div>
              <div className="min-w-[72px] text-right text-sm text-mist">{progressLabel}</div>
            </div>
            <div className="mt-6 h-2 border border-line bg-panel2">
              <div className="h-full bg-gradient-to-r from-cyan to-gold" style={{ width: settings.count === 0 ? "10%" : `${Math.min(100, (sessionIndex / settings.count) * 100)}%` }} />
            </div>
            <div className="mt-5 border border-line bg-panel2 px-4 py-4">
              <div className="text-sm leading-7 text-gold">
                {!question && "Last used drill and options load automatically."}
                {question && !answered && `Listen first. ${settings.tonalContext ? `Tonic: ${question.tonicName}` : "No tonal context."}`}
                {question && answered && `${answered.correct ? "Correct" : "Wrong"} • ${question.notation.title}`}
              </div>
              <div className="mt-2 text-sm text-mist">
                {!question && "Keyboard: space replay prompt, enter replay target, 1-9 0 - = answer."}
                {question && answered && question.notation.subtitle}
              </div>
            </div>
            <canvas ref={canvasRef} className="mt-5 h-[240px] w-full border border-[#cfba86] bg-sand md:h-[280px]" width="1000" height="280" />
          </section>

          <section className="border border-line bg-panel px-5 py-5 md:px-7">
            <div className="flex items-end justify-between gap-4">
              <h3 className="font-display text-4xl uppercase leading-none">Answers</h3>
              <div className="text-sm text-mist">{answerList.length ? `${answerList.length} answers` : "No active question"}</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {answerList.map((answer, index) => {
                const isCorrect = answered && answer.id === question.answerId
                const isWrong = answered && !answered.correct && answer.id === answered.id
                return (
                  <button
                    key={answer.id}
                    onClick={() => submitAnswer(answer.id)}
                    disabled={!question || !!answered}
                    className={`min-h-[98px] border px-4 py-3 text-left transition ${isCorrect ? "border-gold bg-[rgba(244,203,104,0.14)]" : isWrong ? "border-coral bg-[rgba(255,141,121,0.14)]" : "border-line bg-panel2 hover:border-gold"} disabled:cursor-default`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold">{answer.label}</div>
                        <div className="mt-2 text-sm leading-6 text-mist">{answer.subtitle}</div>
                      </div>
                      <div className="text-sm text-cyan">{KEY_HINTS[index] || ""}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {showOptions && (
        <div className="fixed inset-0 z-50 bg-[rgba(2,6,12,0.8)] p-4">
          <div className="mx-auto max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-auto border border-line bg-panel p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-gold">Options</div>
                <h2 className="mt-2 font-display text-5xl uppercase leading-none">{currentDrill().label}</h2>
                <p className="mt-3 text-sm leading-7 text-mist">Pick the exact material you want to drill, then close this and press Start.</p>
              </div>
              <button onClick={() => setShowOptions(false)} className="border border-line bg-panel2 px-4 py-3 hover:border-gold">Close</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <OptionSelect label="Question Count" value={String(settings.count)} onChange={value => setSettings(current => ({ ...current, count: Number(value) }))} options={[["10","10"],["20","20"],["0","Endless"]]} />
              <OptionSelect label="Tempo" value={String(settings.tempo)} onChange={value => setSettings(current => ({ ...current, tempo: Number(value) }))} options={[["64","64"],["76","76"],["92","92"],["108","108"]]} />
              <OptionSelect label="Tonic Pool" value={settings.tonicPool} onChange={value => setSettings(current => ({ ...current, tonicPool: value }))} options={[["starter","Starter"],["circle","Circle"],["chromatic","Chromatic"]]} />
              {settings.drillId === "notes" && <OptionSelect label="Recognition" value={settings.noteMode} onChange={value => setSettings(current => ({ ...current, noteMode: value }))} options={[["functional","Functional"],["absolute","Absolute"]]} />}
            </div>

            <div className="mt-4 grid gap-2">
              <Toggle label="Autoplay Next" checked={settings.autoplay} onChange={checked => setSettings(current => ({ ...current, autoplay: checked }))} />
              <Toggle label="Show Notation After Answer" checked={settings.reveal} onChange={checked => setSettings(current => ({ ...current, reveal: checked }))} />
              <Toggle label="Use Tonal Context" checked={settings.tonalContext} onChange={checked => setSettings(current => ({ ...current, tonalContext: checked }))} />
            </div>

            {settings.drillId === "notes" && (
              <OptionGroup title="Functional Degrees" items={DEGREE_DATA} selected={settings.degrees} onToggle={id => setSettings(current => ({ ...current, degrees: toggle(current.degrees, id, DEGREE_DATA.map(x => x.id)) }))} />
            )}
            {settings.drillId === "notes" && settings.noteMode === "absolute" && (
              <OptionGroup title="Absolute Notes" items={NOTE_NAMES.map(id => ({ id, label: id, subtitle: "note name" }))} selected={settings.noteNames} onToggle={id => setSettings(current => ({ ...current, noteNames: toggle(current.noteNames, id, NOTE_NAMES) }))} />
            )}
            {settings.drillId === "intervals" && (
              <OptionGroup title="Intervals" items={INTERVAL_DATA} selected={settings.intervals} onToggle={id => setSettings(current => ({ ...current, intervals: toggle(current.intervals, id, INTERVAL_DATA.map(x => x.id)) }))} />
            )}
            {settings.drillId === "chords" && (
              <OptionGroup title="Chord Types" items={CHORDS} selected={settings.chords} onToggle={id => setSettings(current => ({ ...current, chords: toggle(current.chords, id, CHORDS.map(x => x.id)) }))} />
            )}
            {settings.drillId === "scales" && (
              <OptionGroup title="Scales / Modes" items={SCALES} selected={settings.scales} onToggle={id => setSettings(current => ({ ...current, scales: toggle(current.scales, id, SCALES.map(x => x.id)) }))} />
            )}
            {settings.drillId === "progressions" && (
              <OptionGroup title="Progressions" items={PROGRESSIONS} selected={settings.progressions} onToggle={id => setSettings(current => ({ ...current, progressions: toggle(current.progressions, id, PROGRESSIONS.map(x => x.id)) }))} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionSelect({ label, value, onChange, options }) {
  return (
    <label className="block border border-line bg-panel2 p-3">
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-mist">{label}</div>
      <select value={value} onChange={event => onChange(event.target.value)} className="w-full border border-line bg-panel px-3 py-3 text-white outline-none">
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 border border-line bg-panel2 px-4 py-3">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="accent-[#f4cb68]" />
      <span>{label}</span>
    </label>
  )
}

function OptionGroup({ title, items, selected, onToggle }) {
  return (
    <section className="mt-5">
      <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-gold">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(item => (
          <label key={item.id} className="flex items-start gap-3 border border-line bg-panel2 px-4 py-3">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} className="mt-1 accent-[#f4cb68]" />
            <span>
              <strong className="block text-base">{item.label}</strong>
              <small className="mt-1 block text-xs leading-5 text-mist">{item.subtitle}</small>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}

function toggle(list, id, fallback) {
  const exists = list.includes(id)
  const next = exists ? list.filter(value => value !== id) : [...list, id]
  return next.length ? next : [...fallback]
}

function midiName(midi) {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pc]}${octave}`
}

function drawNotation(canvas, question, visible) {
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  const ratio = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = width * ratio
  canvas.height = height * ratio
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#f3ecd8"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#40331d"
  ctx.font = '700 16px "JetBrains Mono"'
  ctx.fillText(visible && question ? question.notation.title : "Ear first", 22, 28)
  ctx.font = '500 12px "JetBrains Mono"'
  ctx.fillText(visible && question ? question.notation.subtitle : "Notation appears after you answer or reveal.", 22, 48)
  for (const top of [84, 164]) {
    for (let i = 0; i < 5; i += 1) {
      const y = top + i * 12
      ctx.strokeStyle = "#826f4c"
      ctx.lineWidth = 1.1
      ctx.beginPath()
      ctx.moveTo(40, y)
      ctx.lineTo(width - 24, y)
      ctx.stroke()
    }
  }
  ctx.font = '700 38px "Barlow Condensed"'
  ctx.fillText("𝄞", 46, 123)
  ctx.fillText("𝄢", 46, 203)
  if (!visible || !question) return
  const notes = question.notation.notes.slice(0, 18)
  const xStep = Math.max(30, Math.min(52, (width - 160) / Math.max(1, notes.length)))
  notes.forEach((midi, index) => {
    const x = 118 + index * xStep
    const y = midi >= 60 ? 122 - (midi - 60) * 3 : 202 - (midi - 48) * 3
    ctx.beginPath()
    ctx.ellipse(x, y, 9.5, 7, -0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + 9, y)
    ctx.lineTo(x + 9, y - 29)
    ctx.strokeStyle = "#40331d"
    ctx.lineWidth = 1.4
    ctx.stroke()
  })
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
