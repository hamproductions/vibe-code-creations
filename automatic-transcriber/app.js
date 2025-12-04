// --- CONFIG ---
const FRAME_SIZE = 8192;
const HOP_SIZE = 2048;

// --- GLOBALS ---
let essentia = null;
let essentiaWasm = null;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isCancelled = false;

// Data State
let beatData = [];
let chordData = [];
let gridOffset = 0;
let detectedKey = "";
let detectedScale = "";

// DOM Elements
const ui = {
    inputs: [document.getElementById('file-input-header'), document.getElementById('file-input-main')],
    player: document.getElementById('audio-el'),
    grid: document.getElementById('grid-container'),
    emptyState: document.getElementById('empty-state'),
    loader: document.getElementById('loading-overlay'),
    loadText: document.getElementById('loading-text'),
    loadBar: document.getElementById('global-progress'),
    status: document.getElementById('system-status'),
    meta: {
        bpm: document.getElementById('meta-bpm'),
        key: document.getElementById('meta-key'),
        offset: document.getElementById('meta-offset')
    }
};

// --- INIT ---
// Ensure EssentiaWASM is available globally from the script tag
if (typeof EssentiaWASM !== 'undefined') {
    EssentiaWASM().then((mod) => {
        essentiaWasm = mod;
        essentia = new Essentia(mod);
        ui.status.innerText = "System Ready";
        ui.status.classList.replace("text-green-400", "text-blue-400");
        console.log("Essentia Loaded");
    });
} else {
    console.error("EssentiaWASM not loaded");
}

// --- EVENT LISTENERS ---
ui.inputs.forEach(input => {
    if(input) input.addEventListener('change', handleUpload);
});

// Cancel Button Logic
window.cancelProcess = () => {
    isCancelled = true;
    showLoad(false);
    ui.status.innerText = "Cancelled";
    ui.player.src = "";
};

ui.player.addEventListener('timeupdate', () => {
    const t = ui.player.currentTime;

    // Optimization: Only update class if beat changed
    const beatIdx = findBeatIndex(t);
    const adjustedIdx = beatIdx - gridOffset;

    // Remove old highlight
    const currentActive = document.querySelector('.playing');
    if (currentActive) {
        const currentId = parseInt(currentActive.id.replace('beat-', ''));
        if (currentId === adjustedIdx) return; // Same beat, do nothing
        currentActive.classList.remove('playing');
    }

    // Add new highlight
    if (adjustedIdx >= 0) {
        const el = document.getElementById(`beat-${adjustedIdx}`);
        if (el) {
            el.classList.add('playing');
            // Smart Scroll: Keep centered
            const rect = el.getBoundingClientRect();
            const containerRect = ui.grid.getBoundingClientRect();
            // Check if element is out of view (vertically)
            // We use a simple check against window height or container bounds
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                el.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
            }
        }
    }
});

// --- CORE PIPELINE ---
async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Reset
    isCancelled = false;
    beatData = [];
    chordData = [];
    gridOffset = 0;
    ui.meta.offset.innerText = "0";
    ui.player.src = URL.createObjectURL(file);

    // Clear Grid & Show Loader
    ui.grid.innerHTML = "";
    ui.emptyState.classList.add('hidden'); // Hide CTA
    showLoad(true);
    updateProgress(10, "Decoding Audio...");

    try {
        const buffer = await file.arrayBuffer();
        if(isCancelled) return;

        const audioBuffer = await audioCtx.decodeAudioData(buffer);
        if(isCancelled) return;

        updateProgress(30, "Analyzing Structure...");

        // Allow UI render
        setTimeout(() => processAudio(audioBuffer), 100);
    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
        showLoad(false);
        ui.emptyState.classList.remove('hidden'); // Show CTA again
    }
}

async function processAudio(audioBuffer) {
    try {
        const pcm = audioBuffer.getChannelData(0);
        const sr = audioBuffer.sampleRate;

        // 1. Beat Tracking (WASM)
        const vec = essentia.arrayToVector(pcm);
        const beatAlgo = essentia.BeatTrackerDegara(vec);
        vec.delete();

        const rawBeats = essentia.vectorToArray(beatAlgo.ticks);

        if (rawBeats.length < 2) {
            const duration = audioBuffer.duration;
            for(let t=0; t<duration; t+=0.5) beatData.push(t);
            ui.meta.bpm.innerText = "120 (Est)";
        } else {
            beatData = Array.from(rawBeats);
            ui.meta.bpm.innerText = Math.round(beatAlgo.bpm);
        }

        // 2. Key Detection
        const keySlice = pcm.subarray(0, Math.min(pcm.length, sr * 60));
        const keyVec = essentia.arrayToVector(keySlice);
        const keyRes = essentia.KeyExtractor(keyVec);
        detectedKey = keyRes.key;
        detectedScale = keyRes.scale;
        ui.meta.key.innerText = `${detectedKey} ${detectedScale}`;
        keyVec.delete();

        // 3. Smart Chroma Extraction
        updateProgress(50, "Extracting Harmonics...");

        const templates = generateTemplates(detectedKey, detectedScale);
        // STORE FULL CHROMAGRAM instead of making decisions immediately
        const fullChromagram = [];

        const frameVec = new essentiaWasm.VectorFloat();
        frameVec.resize(FRAME_SIZE, 0.0);

        for (let i = 0; i < pcm.length; i += HOP_SIZE) {
            if (isCancelled) { frameVec.delete(); return; }

            if (i % (HOP_SIZE * 100) === 0) {
                updateProgress(50 + (i/pcm.length)*40, "Listening...");
                await nextTick();
            }

            if (i + FRAME_SIZE > pcm.length) break;

            const slice = pcm.subarray(i, i+FRAME_SIZE);

            let sum = 0;
            for(let s of slice) sum += s*s;
            // RMS Gate
            if (Math.sqrt(sum/FRAME_SIZE) < 0.015) {
                fullChromagram.push(null);
                continue;
            }

            for(let k=0; k<FRAME_SIZE; k++) frameVec.set(k, slice[k]);

            const w = essentia.Windowing(frameVec, true, FRAME_SIZE, "hann");
            const s = essentia.Spectrum(w.frame);
            const spec = essentia.vectorToArray(s.spectrum);

            const chroma = getSmartChroma(spec, sr);
            fullChromagram.push(chroma);

            w.frame.delete();
            s.spectrum.delete();
        }
        frameVec.delete();

        // 4. Synchronize & Smooth
        updateProgress(95, "Syncing & Smoothing...");

        // NEW: Pass full chromagram to sync function for time-averaging
        chordData = syncChordsSmartly(beatData, fullChromagram, sr, templates);

        renderGrid();
        showLoad(false);
        ui.status.innerText = "Ready";

    } catch (err) {
        console.error(err); // Log error for debug
        alert("Pipeline Crash: " + err.message);
        showLoad(false);
        ui.emptyState.classList.remove('hidden');
    }
}

// --- MATH & ALGORITHMS ---

function getSmartChroma(spec, sr) {
    const chroma = new Array(12).fill(0);
    const binWidth = sr / ((spec.length - 1) * 2);
    const minBin = Math.floor(50 / binWidth);
    const maxBin = Math.floor(2000 / binWidth);

    for (let i = minBin; i < maxBin; i++) {
        const mag = spec[i];
        // Stricter Peak Picking to reduce noise
        if (spec[i-1] > mag || spec[i+1] > mag) continue;
        if (mag < 0.1) continue; // Raised threshold from 0.05

        const freq = i * binWidth;
        const midi = 69 + 12 * Math.log2(freq / 440);
        const noteIndex = Math.round(midi);

        if (noteIndex > 0) {
            const pc = noteIndex % 12;
            // Stronger bass weight for stability
            const weight = freq < 150 ? 4.0 : 1.0;
            chroma[pc] += mag * weight;
        }
    }
    const maxVal = Math.max(...chroma);
    return maxVal > 0 ? chroma.map(v => v / maxVal) : chroma;
}

function generateTemplates(key, scale) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const temps = {};

    notes.forEach((root, i) => {
        let v = new Array(12).fill(0);
        // Sharper templates (punish wrong notes more)
        v[i] = 1; v[(i+4)%12] = 0.6; v[(i+7)%12] = 0.8;
        temps[root] = v;

        v = new Array(12).fill(0);
        v[i] = 1; v[(i+3)%12] = 0.6; v[(i+7)%12] = 0.8;
        temps[root + "m"] = v;
    });
    return temps;
}

function matchChord(chroma, templates) {
    let maxScore = 0;
    let best = null;

    for(const [name, temp] of Object.entries(templates)) {
        let dot = 0, mA = 0, mB = 0;
        for(let i=0; i<12; i++) {
            dot += chroma[i] * temp[i];
            mA += chroma[i] * chroma[i];
            mB += temp[i] * temp[i];
        }
        const score = (mA>0 && mB>0) ? dot / (Math.sqrt(mA) * Math.sqrt(mB)) : 0;
        if (score > maxScore) { maxScore = score; best = name; }
    }
    // Higher threshold for acceptance
    return maxScore > 0.75 ? best : null;
}

// NEW: Smart Synchronization with Smoothing
function syncChordsSmartly(beats, fullChromagram, sr, templates) {
    const frameDur = HOP_SIZE / sr;
    const beatChromas = [];

    // 1. Average Chroma per Beat
    for (let i = 0; i < beats.length - 1; i++) {
        const start = beats[i];
        const end = beats[i+1];
        const sF = Math.floor(start / frameDur);
        const eF = Math.floor(end / frameDur);

        const avg = new Array(12).fill(0);
        let count = 0;

        for(let f=sF; f<eF; f++) {
            if (f < fullChromagram.length && fullChromagram[f]) {
                for(let k=0; k<12; k++) avg[k] += fullChromagram[f][k];
                count++;
            }
        }

        if (count > 0) {
            for(let k=0; k<12; k++) avg[k] /= count;
            beatChromas.push(avg);
        } else {
            beatChromas.push(null); // Silence
        }
    }

    // 2. Temporal Smoothing (Hysteresis)
    // Blend current beat with previous beat to prevent flickering
    const smoothedChromas = [];
    let prev = new Array(12).fill(0);

    for (let i = 0; i < beatChromas.length; i++) {
        const curr = beatChromas[i];
        if (!curr) {
            smoothedChromas.push(null);
            prev = new Array(12).fill(0);
            continue;
        }

        const blended = new Array(12).fill(0);
        for(let k=0; k<12; k++) {
            // 70% current, 30% history
            blended[k] = (curr[k] * 0.7) + (prev[k] * 0.3);
        }
        smoothedChromas.push(blended);
        prev = blended;
    }

    // 3. Match Templates
    let rawChords = smoothedChromas.map(ch => ch ? matchChord(ch, templates) : "-");

    // 4. Post-Process: Glitch Removal (Filter short deviations)
    // If we see A - B - A, replace B with A
    const finalChords = [...rawChords];
    for (let i = 1; i < finalChords.length - 1; i++) {
        const prevC = finalChords[i-1];
        const currC = finalChords[i];
        const nextC = finalChords[i+1];

        if (prevC === nextC && currC !== prevC) {
            finalChords[i] = prevC; // Smooth over the glitch
        }
    }

    return finalChords;
}

// --- GRID RENDER LOGIC ---
function renderGrid() {
    const container = ui.grid;
    container.innerHTML = "";
    const BEATS = 4;

    let dataView = [...chordData];
    if (gridOffset < 0) dataView = dataView.slice(Math.abs(gridOffset));
    else if (gridOffset > 0) dataView = [...new Array(gridOffset).fill("-"), ...dataView];

    let barNum = 1;

    for(let i=0; i<dataView.length; i+=BEATS) {
        const measureBeats = dataView.slice(i, i+BEATS);
        while(measureBeats.length < BEATS) measureBeats.push("-");

        const mDiv = document.createElement('div');
        // Tailwind class replacement for .measure
        mDiv.className = 'bg-gray-800 border border-gray-700 rounded-md flex flex-col h-[100px] relative flex-grow min-w-[180px] max-w-[300px] overflow-hidden';

        // Tailwind class replacement for .measure-num
        mDiv.innerHTML = `<div class="absolute top-[2px] left-[5px] text-[0.6rem] text-gray-500 z-10 select-none">${barNum}</div>`;

        const bCont = document.createElement('div');
        // Tailwind class replacement for .beats-container
        bCont.className = 'flex h-full w-full';

        const first = measureBeats[0];
        const allSame = measureBeats.every(c => c === first);

        if (allSame && first !== "-") {
            const id = i;
            bCont.innerHTML = createChordBox(first, id, 4);
        } else {
            measureBeats.forEach((chord, beatRelIdx) => {
                bCont.innerHTML += createChordBox(chord, i + beatRelIdx, 1);
            });
        }

        mDiv.appendChild(bCont);
        container.appendChild(mDiv);
        barNum++;
    }
}

function createChordBox(chord, index, span) {
    let cls = "text-gray-600 font-normal text-base"; // default c-none equivalent
    let txt = "&bull;";

    if (chord && chord !== "-") {
        txt = chord;
        if (chord.includes("m")) {
            cls = "text-red-400"; // c-min equivalent
        } else {
            cls = "text-blue-400"; // c-maj equivalent
        }
    }

    // c-dim logic was: color #fbbf24 (amber-400) text-size 1rem
    // But in current logic only "m" and non-"m" are distinguished for now,
    // unless the chord name contains 'dim' explicitly which isn't in detected templates yet?
    // The templates generator only does Major and Minor.

    let realBeatIdx = index - gridOffset;
    let tStart = 0;

    if (realBeatIdx >= 0 && realBeatIdx < beatData.length) {
        tStart = beatData[realBeatIdx];
    }

    // Tailwind for chord-box
    // flex-1 border-r border-gray-700 flex items-center justify-center font-extrabold text-[1.2rem] cursor-pointer transition-colors hover:bg-gray-700 relative
    // We handle border-r via 'last:border-r-0' in the container or explicitly here.
    // The original code used :last-child css rule. Tailwind can do `last:border-r-0`.
    const boxBase = "flex-1 border-r border-gray-700 last:border-r-0 flex items-center justify-center font-extrabold text-xl cursor-pointer transition-colors hover:bg-gray-700 relative";

    if (realBeatIdx < 0) {
        return `<div class="flex-1 opacity-50 cursor-default flex items-center justify-center border-r border-gray-700 last:border-r-0" style="flex:${span}">-</div>`;
    }

    return `<div id="beat-${realBeatIdx}" class="${boxBase} ${cls}" style="flex:${span}" onclick="seek(${tStart})">${txt}</div>`;
}

// --- HELPERS ---
window.shiftGrid = (dir) => {
    if (beatData.length === 0) return;
    gridOffset += dir;
    ui.meta.offset.innerText = gridOffset;
    renderGrid();
};

window.seek = (t) => {
    ui.player.currentTime = t;
    ui.player.play();
};

function findBeatIndex(t) {
    for(let i=0; i<beatData.length-1; i++) {
        if (t >= beatData[i] && t < beatData[i+1]) return i;
    }
    return -1;
}

function showLoad(b) {
    if(b) ui.loader.classList.remove('hidden');
    else ui.loader.classList.add('hidden');
}

function updateProgress(pct, txt) {
    ui.loadBar.style.width = pct + "%";
    ui.loadText.innerText = txt;
}

function nextTick() { return new Promise(r => setTimeout(r,0)); }
