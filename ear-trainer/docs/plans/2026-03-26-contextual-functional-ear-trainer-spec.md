# Contextual Functional Ear Trainer Specification

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page ear training app that is simple to open, addictive to repeat, and exhaustive in musical coverage while staying frictionless for absolute beginners through advanced players.

**Architecture:** A tiny static app made of `index.html`, `app.css`, and `app.js` with no build step. The app runs entirely client-side, stores state in `localStorage`, uses a cached Web Audio piano-like engine, and renders notation and keyboard state with `<canvas>` and semantic HTML.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Web Audio API, Canvas 2D, `localStorage`.

---

## 1. Product Positioning

### 1.1 Product Name

The product name is `ChordVibe Ear Lab`.

### 1.2 Product Promise

The app is not a generic quiz bank and not a fake “perfect pitch grinder.” It is a contextual relative-pitch trainer built around tonal gravity, short sessions, immediate correction, and low-friction repetition.

### 1.3 Target Users

- Absolute beginners who can only hear “up/down” and need stable tonal anchors.
- Intermediate players who want faster note, interval, chord, scale, and cadence recognition.
- Jazz players who need altered dominants, modal colors, modulations, and progression hearing.
- J-pop and anisong listeners/composers who need secondary dominants, modal interchange, royal road variants, and flashy color-chord hearing.

### 1.4 Non-Negotiable Experience Goals

- Open and start in under 5 seconds.
- A single tap or spacebar always starts a question.
- A complete micro-session takes 45 seconds to 3 minutes.
- No account, no onboarding wall, no unlock tree, no XP grind.
- The app never hides advanced content; it organizes it into presets and custom filters.
- The interface must feel deliberate, sharp, and music-tool-like, not “ed-tech.”

## 2. Learning Methodology

### 2.1 Primary Learning Doctrine

The app uses contextual functional ear training as the default learning model. Every question begins with a tonal anchor. The user does not identify detached sonic objects in a vacuum unless a specific mode explicitly says `absolute`.

### 2.2 Pedagogical Basis

The implementation must embody these rules:

- Tonal context is established before judgment.
- The app favors function over isolated label memorization.
- Short frequent retrieval is favored over long fatiguing sessions.
- Immediate correction is mandatory after every wrong answer.
- Singing-friendly tessitura is mandatory.
- Mixed review happens only after a user demonstrates baseline stability inside a smaller preset.

### 2.3 Question Loop

Every standard question uses this exact sequence:

1. `Prime`: establish tonal center with cadence, tonic pedal, or progression shell.
2. `Present`: play the target event.
3. `Wait`: do not reveal notation or answer until the user commits.
4. `Judge`: accept keyboard or touch input instantly.
5. `Correct`: if right, replay the answer in context and reveal notation.
6. `Contrast`: if wrong, replay the user’s wrong answer, then the correct answer, then the correct answer resolving in context.
7. `Advance`: either auto-advance after a short delay or wait for `Next`, depending on autoplay setting.

### 2.4 Allowed Training Frames

- `Functional note`: identify the degree relative to tonic.
- `Functional interval`: hear start degree then destination degree inside a key; answer by interval label.
- `Chord quality`: hear a single chord after cadence; answer chord quality.
- `Roman function`: hear a scale-degree chord inside context; answer Roman numeral or harmonic role.
- `Scale and mode`: hear an ascending then descending scalar phrase from tonic; answer scale or mode.
- `Progression`: hear a compact loop of 3 to 5 chords; answer progression label.
- `Modulation`: hear initial cadence, modulation move, and arrival; answer destination or modulation type.

### 2.5 Session Structure

Default session length is 12 questions. Alternate session lengths are 5, 20, and endless.

The app must support:

- `micro`: 5 questions
- `default`: 12 questions
- `deep`: 20 questions
- `free`: endless until stopped

## 3. Content Model

### 3.1 Pitch-Class Naming

The display naming system uses sharps by default with optional flat display where harmonic spelling calls for flats.

Enharmonic display rules:

- Major sharp keys: use sharps.
- Flat-side borrowed or modal-interchange items may display flats.
- Degrees always take precedence over note names in answer buttons when the mode is functional.

### 3.2 Absolute Scale Degree Dictionary

The app must hardcode these degrees in this order:

`1, b2, 2, b3, 3, 4, #4/b5, 5, b6, 6, b7, 7`

Each entry must include:

- `id`
- `label`
- `semitone`
- `solfege`
- `aliases`
- `color role`

Exact mappings:

| id | semitone | solfege | aliases |
| --- | --- | --- | --- |
| 1 | 0 | do | tonic |
| b2 | 1 | ra | flat second |
| 2 | 2 | re | second |
| b3 | 3 | me | minor third |
| 3 | 4 | mi | major third |
| 4 | 5 | fa | fourth |
| #4/b5 | 6 | fi / se | tritone |
| 5 | 7 | sol | fifth |
| b6 | 8 | le | minor sixth |
| 6 | 9 | la | major sixth |
| b7 | 10 | te | minor seventh |
| 7 | 11 | ti | major seventh |

### 3.3 Interval Dictionary

The app must include exactly these interval labels in this order:

`m2, M2, m3, M3, P4, TT, P5, m6, M6, m7, M7, P8, m9, M9, m10, M10, P11, #11, P12, m13, M13`

Each interval entry must include:

- `id`
- `semitones`
- `staffSteps`
- `display`
- `aliases`
- `category`

### 3.4 Chord Dictionary

Every chord entry must include:

- `id`
- `display`
- `family`
- `intervalsFromRoot`
- `commonSymbols`
- `tensionProfile`
- `allowedFunctions`
- `voicingTemplateIds`

#### 3.4.1 Triads

- Major
- Minor
- Diminished
- Augmented
- sus2
- sus4

#### 3.4.2 Seventh Chords

- M7
- m7
- 7
- m7b5
- dim7
- mM7
- M7#5
- m7#5
- 7sus4

#### 3.4.3 Extended and Altered Chords

- 9
- M9
- m9
- 11
- #11
- 13
- M13
- m13
- 7b9
- 7#9
- 7b5
- 7#5
- 7b9b5
- 7b9#5
- 7#9b5
- 7#9#5

### 3.5 Scale and Mode Dictionary

Every scale entry must include:

- `id`
- `display`
- `family`
- `degreePattern`
- `semitones`
- `guideChord`
- `avoidNotes`
- `vibeTags`
- `genres`

#### 3.5.1 Major-System Modes

- Ionian
- Dorian
- Phrygian
- Lydian
- Mixolydian
- Aeolian
- Locrian

#### 3.5.2 Melodic Minor System

- Melodic Minor
- Dorian b2
- Lydian Augmented
- Lydian Dominant
- Mixolydian b6
- Locrian #2
- Altered Scale

#### 3.5.3 Harmonic Minor System

- Harmonic Minor
- Locrian Natural 6
- Ionian #5
- Dorian #4
- Phrygian Dominant
- Lydian #2
- Super Locrian bb7

#### 3.5.4 Symmetrical

- Whole Tone
- Half-Whole Diminished
- Whole-Half Diminished

#### 3.5.5 Pentatonic and Japanese Color

- Major Pentatonic
- Minor Pentatonic
- Blues Scale
- In Sen
- Hirajoshi

### 3.6 Chord Progression Dictionary

Every progression entry must include:

- `id`
- `display`
- `romanNumerals`
- `functionSummary`
- `genreTags`
- `borrowedChords`
- `secondaryDominants`
- `modulationPotential`
- `voicingProfile`

#### 3.6.1 Pop and J-Pop Core

- I-V-vi-IV
- IV-V-iii-vi
- vi-IV-I-V
- IV-I-V-vi

#### 3.6.2 Jazz Core

- ii-V-I major
- ii-V-i minor
- I-vi-ii-V
- iii-vi-ii-V
- ii-subV-I

#### 3.6.3 Anisong and Advanced J-Pop

- IV-V-III7-vi
- bVI-bVII-I
- iv-I
- I-Iaug-I6-I7

### 3.7 Modulation Dictionary

The app must include these modulation types:

- direct up whole step
- direct up half step
- common-tone modulation
- secondary dominant tonicization
- pivot chord to dominant
- pivot chord to relative minor
- borrowed iv to tonic major return

### 3.8 Presets

Every preset must hardcode:

- enabled training modes
- enabled content subsets
- cadence profile
- tessitura profile
- session length
- answer density
- timing values
- default arpeggiation mode
- notation reveal rules
- weighting rules

Required presets:

- `Zero Effort Start`
- `Absolute Beginner`
- `Functional Degrees`
- `Intervals Core`
- `Chord Qualities Core`
- `Scale and Mode Core`
- `Pop and J-Pop`
- `Anisong Colors`
- `Jazz Cat`
- `Composer All-Rounder`
- `Custom Match`

### 3.9 Custom Match

Custom mode must expose all content and never omit advanced entries. The user must be able to include exactly one item if desired.

The custom modal must allow toggling by:

- training mode
- degree
- interval
- chord quality
- scale family
- scale name
- progression family
- progression name
- modulation type
- tonic key pool
- accidental policy
- cadence type
- arpeggiation type
- answer reveal timing

## 4. Audio Specification

### 4.1 Runtime Constraint

The implementation must remain a trivial static bundle. No build process. No dependency install. No fetched soundfont at runtime.

### 4.2 Practical Audio Decision

For the actual static implementation, the engine uses pre-rendered Web Audio note buffers generated at startup. Each pitch is synthesized offline using:

- one fundamental partial
- multiple detuned upper partials
- a short filtered attack noise burst
- fast hammer transient
- exponential amplitude decay
- mild low-pass filtering
- light convolution-style ambience generated procedurally

This is the locked implementation choice for file-size control and low latency.

### 4.3 Piano Range

Cache note buffers for MIDI 36 through 96 inclusive.

### 4.4 Polyphony

Minimum simultaneous note count: 16.

### 4.5 Velocity Humanization

Cadence and progression notes randomize velocity between 0.72 and 0.96.

Target-note velocity rules:

- single notes: 0.9 to 1.0
- target chords: 0.82 to 0.96
- wrong-answer contrast playback: 0.68 to 0.82

### 4.6 Timing

Default tempo options:

- 62 BPM
- 76 BPM
- 92 BPM
- 108 BPM

Default selected tempo: 76 BPM.

### 4.7 Cadence Profiles

Cadence profiles:

- `major-basic`: I-IV-V-I
- `major-soft`: I-ii-V-I
- `minor-basic`: i-iv-V-i
- `minor-jazz`: i-iv-V7alt-i
- `drone`: tonic pedal plus fifth
- `jpop-lift`: IV-V-iii-vi into tonic recall

### 4.8 Voicing Rules

Block-chord voicing ranges:

- bass: C2 to C3
- tenor: G2 to G3
- alto: C3 to C4
- soprano: G3 to G5

Jazz voicing profiles:

- shell voicing
- root-position close
- drop-2
- rootless A
- rootless B

Pop voicing profiles:

- spread triad
- wide pad
- octave doubled top note

### 4.9 Tessitura

All targets must fall between C3 and G5 unless the user explicitly enables `wide`.

### 4.10 Chord Playback Modes

Supported playback types:

- block
- arpeggio up
- arpeggio down
- broken in thirds

### 4.11 Feedback Playback

On wrong answer:

1. short error tick
2. play wrong answer as if it were intended
3. wait 220ms
4. play correct answer
5. if chord or progression question, resolve it to tonic
6. reveal notation and textual explanation

On right answer:

1. soft success tick
2. replay correct answer
3. optional resolve to tonic
4. reveal notation

## 5. UI Specification

### 5.1 File Layout

The implementation uses:

- `index.html`
- `app.css`
- `app.js`

### 5.2 View Structure

The page is a single-screen app with vertical sections:

1. top status rail
2. center interaction stage
3. answer grid
4. bottom quick settings strip

### 5.3 Visual Language

The implementation must feel like a sharp hardware practice box, not a soft education site.

Locked visual decisions:

- background: near-black graphite
- main surface: dark steel
- accent 1: warm gold
- accent 2: icy cyan
- accent 3: warning coral
- typography: bold condensed headlines plus readable mono/data text look
- no glassmorphism
- no pastel gradients
- no shadows heavier than subtle outline glow
- noteheads, staff lines, and piano keys must render crisp on high-DPI displays

### 5.4 Responsive Layout

Breakpoints:

- `compact`: under 700px
- `wide`: 700px and above

Compact rules:

- top rail stacks into two rows
- controls become full-width chips
- answer grid uses 2 columns minimum
- notation canvas stays visible above answers

Wide rules:

- top rail is one line
- center stage uses two columns
- answer grid can expand to 4 to 6 columns depending on answer count

### 5.5 Top Status Rail

The top rail must show:

- app title
- preset selector
- mode selector
- question counter
- streak
- rolling accuracy
- current tonic
- current tempo
- audio state

### 5.6 Center Stage

The stage contains:

- prominent `Play / Next` control
- `Repeat Context`
- `Repeat Target`
- `Reveal Last`
- mini session progress bar
- feedback line
- notation canvas
- compact piano visualization strip

### 5.7 Answer Grid

The answer grid is dynamically rebuilt from the enabled answer pool.

Rules:

- every answer is a large rectangular button
- each button shows primary label and optional subtitle
- keyboard hint appears in the top-right corner of each button
- correct button glows gold on reveal
- wrong chosen button flashes coral

### 5.8 Bottom Quick Settings Strip

This strip contains:

- session length
- autoplay toggle
- arpeggiation toggle
- notation toggle
- tonic pool selector
- `Custom` button
- `Reset Stats` button

## 6. Interaction Specification

### 6.1 First-Load State

On first load:

- preset defaults to `Zero Effort Start`
- mode defaults to `functional-note`
- tonic pool defaults to `C, D, E, F, G, A`
- audio status reads `tap to arm`
- one prominent button says `Start Session`

### 6.2 Audio Unlock

The first pointer or keyboard interaction initializes the audio context and pre-renders note buffers.

While the cache is preparing:

- show progress text
- disable answer buttons
- keep UI responsive

### 6.3 Question Lifecycle States

The app uses these exact internal states:

- `idle`
- `priming`
- `target`
- `awaiting-answer`
- `judging`
- `revealed`
- `transitioning`

### 6.4 Autoplay

If autoplay is enabled:

- after a correct answer, next question starts in 900ms
- after a wrong answer, next question starts in 1500ms

If disabled:

- `Next` becomes active and nothing auto-starts

### 6.5 Keyboard Controls

Locked bindings:

- `Space`: play or repeat context
- `Enter`: play or repeat target, or advance after reveal
- `Tab`: cycle focus between preset, mode, and main control
- `ArrowLeft` and `ArrowRight`: previous or next preset
- `ArrowUp` and `ArrowDown`: previous or next mode
- `R`: repeat full question
- `C`: repeat context only
- `T`: repeat target only
- `N`: next question
- `M`: toggle notation reveal
- `A`: toggle arpeggiation
- `1` to `9`, `0`, `-`, `=`: answer buttons in visual order

### 6.6 Pointer and Touch

Use `pointerdown` for buttons. Do not use `click` for primary answer actions.

### 6.7 Focus Rules

The page is keyboard-first. After every reveal or new question, focus returns to the main app shell so hotkeys work immediately.

## 7. Generation Rules

### 7.1 Tonic Selection

By default, tonic is chosen from the selected tonic pool and cannot repeat more than twice consecutively.

### 7.2 Repetition Control

The exact same answer item cannot repeat within the last 3 questions unless the active pool contains fewer than 4 items.

### 7.3 Difficulty Weighting

Question weighting depends on preset:

- beginner presets overweight stable tones and common qualities
- intermediate presets include balanced chromatic and diatonic mix
- advanced presets overweight altered dominants, borrowed colors, and deceptive changes

### 7.4 Functional Note Generation

Rules:

- play cadence in chosen key
- play target note centered between C3 and G5
- answer pool uses enabled degrees only
- reveal shows degree, note name, and solfege

### 7.5 Functional Interval Generation

Rules:

- play cadence
- play source degree
- 180ms gap
- play destination degree
- answer pool uses enabled intervals
- reveal shows both degrees and exact interval

### 7.6 Chord Quality Generation

Rules:

- cadence establishes key
- target chord is voiced according to preset profile
- target may be diatonic or chromatic depending on enabled set
- answer by quality label, not root name
- reveal shows chord symbol, Roman context, and chord tones

### 7.7 Roman Function Generation

Rules:

- cadence establishes key
- target chord is played as a function within the key
- answer buttons show Roman numerals only
- reveal shows Roman numeral, chord quality, and likely resolution

### 7.8 Scale and Mode Generation

Rules:

- play tonic drone or cadence
- play scale ascending and descending over one octave
- target starts on tonic unless `modal center` preset says otherwise
- answer by scale or mode name
- reveal shows degree formula and guide chord

### 7.9 Progression Generation

Rules:

- play a 3 to 5 chord loop
- each chord lasts one beat in the default tempo
- answer by progression name or Roman string
- reveal shows Roman string and genre notes

### 7.10 Modulation Generation

Rules:

- establish source key
- play modulation move
- land in destination key with one confirming tonic sonority
- answer by destination relation or modulation type, depending on preset

## 8. Scoring and Motivation

### 8.1 No Grind Policy

The app does not have:

- XP bars
- unlock trees
- consumable energy
- rarity drops
- level gates

### 8.2 Allowed Motivation Layer

The app does have:

- streak
- rolling accuracy
- best micro-session
- recent weak items
- `one more run` quick restart

### 8.3 Accuracy Metrics

Store:

- lifetime answers
- lifetime correct
- preset-level stats
- mode-level stats
- item-level miss counts

### 8.4 Smart Review

If `smart review` is enabled, weak items receive 1.8x weight until answered correctly twice in the current session.

## 9. Notation and Visualization

### 9.1 Ear-First Rule

No notation is shown before an answer is locked unless the user explicitly enables `study overlay`.

### 9.2 Notation Renderer

The implementation uses Canvas 2D, not external notation libraries.

The renderer must support:

- treble staff
- bass staff
- noteheads
- stems
- ledger lines
- accidentals
- chord stacks
- simple barline framing
- Roman numeral caption

### 9.3 Piano Strip

A compact piano strip under the staff shows the last revealed pitches.

### 9.4 Crisp Rendering

Canvas must scale by `devicePixelRatio` for sharp lines.

## 10. Persistence

### 10.1 Storage Key

Use one `localStorage` key:

`chordvibe-ear-lab-v1`

### 10.2 Stored Data

Persist:

- selected preset
- selected mode
- session length
- notation toggle
- autoplay
- arpeggiation
- tonic pool
- stats
- custom mode selections

### 10.3 Reset

`Reset Stats` clears only metrics, not user preferences.

## 11. Accessibility

### 11.1 Required Behaviors

- all controls reachable by keyboard
- visible focus ring
- high contrast minimum 4.5:1 for body text
- reduced motion respected
- buttons have `aria-label` where text is insufficient
- no color-only correctness signaling

## 12. Implementation Deliverable Contract

The other AI must produce exactly:

- `index.html`
- `app.css`
- `app.js`
- optional documentation files under `docs/`

No frameworks. No bundler. No dependency install.

## 13. Scope Priorities

### 13.1 Must Ship

- static no-build app
- contextual note, interval, chord, scale, and progression quizzes
- presets
- custom mode
- piano-like audio engine
- keyboard controls
- notation reveal
- responsive UI
- persistent stats

### 13.2 Nice If Time Remains

- deeper modulation drills
- rootless jazz voicing variants
- extra explanatory copy per answer
- study overlay mode

## 14. Explicit Decisions to Prevent Drift

- Do not build a login system.
- Do not build social features.
- Do not build a lesson article feed.
- Do not add a progression unlock tree.
- Do not make users type note names.
- Do not force absolute pitch mode as the default.
- Do not use ugly raw oscillators without offline tone shaping.
- Do not use external assets in the implementation.
- Do not omit advanced harmonic material; hide it behind presets, not absence.
