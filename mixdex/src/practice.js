// Practice: setup screen + quiz sessions (Tap Bank / Rhythm), SRS grading, results.
import { nextUp } from './seed.js';
import { store, getVocab, getSiblings, updateSettings } from './state.js';
import { saveProgress, logReview, getMeta, setMeta } from './db.js';
import { STATUS, applyGrade, gradeRecall, gradeRhythm, judgeTap, rhythmWindows, describeInterval } from './srs.js';
import { buildQueue, countQueue, makeBank, makeOptions, seqFor, readingFor, resolveSpeed, tokenMs, parMs, dayKey } from './engine.js';
import { ensureAudio, audioNow, click, blip, buzz } from './audio.js';
import { esc, $, $$, tokHtml, tokText, rowsOf, mixName, mixSub, trig, toast, fmtMs, pct, oshiSub } from './ui.js';
import { t, getLang } from './i18n.js';

let S = null; // active session
export const sessionActive = () => !!S;
const view = () => $('#view');

async function newUsedToday() {
  const v = await getMeta('newToday');
  return v && v.day === dayKey() ? v.count : 0;
}
async function bumpNew() {
  const n = (await newUsedToday()) + 1;
  await setMeta('newToday', { day: dayKey(), count: n });
}

// ---------------------------------------------------------------- setup screen
export async function renderSetup() {
  const st = store.get(), s = st.settings;
  const newUsed = await newUsedToday();
  if (store.get().session || store.get().tab !== 'practice') return;
  const c = countQueue(st.mixes, st.progress, { newLimit: s.newPerDay, newUsed });
  const mastered = [...st.progress.values()].filter(p => p.status === STATUS.MASTERED).length;
  const known = new Set([...st.progress.values()].filter(p => p.status !== STATUS.NOT_LEARNED).map(p => p.mixId));
  const picks = nextUp(s.level || 'beginner', st.mixes.filter(m => m.source === 'seed'), known, 4);
  const suggest = picks.length ? `<div class="panel"><div class="small muted" style="margin-bottom:8px">${t('suggested')}</div><div class="chips" style="flex-wrap:wrap">${picks.map(m => `<button class="chip" data-act="d-practice" data-id="${m.id}">▶ ${esc(mixName(m))}</button>`).join('')}</div></div>` : '';
  const seg = (name, opts, cur) => `<div class="seg big" role="group">${opts.map(([v, l]) => `<button data-act="set" data-k="${name}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  view().innerHTML = `<div class="fadein">
    <div class="panel hero"><div class="stats4">
      <div class="stat"><b>${c.due}</b><span>${t('due')}</span></div>
      <div class="stat"><b>${c.fresh}</b><span>${t('newCards')}</span></div>
      <div class="stat"><b>${mastered}</b><span>${t('mastered')}</span></div>
      <div class="stat"><b>${[...st.progress.values()].filter(p => p.status !== STATUS.NOT_LEARNED).length}</b><span>${t('collected')}</span></div>
    </div>
    <div style="margin-top:16px">${c.due + c.fresh ? '' : `<p class="muted small">${t('nothingDue')}</p>`}
    <button class="btn primary block" data-act="s-start" ${c.due + c.fresh ? '' : 'disabled'}>${t('startSession')}</button></div></div>
    ${suggest}
    <div class="field"><label>${t('mode')}</label>${seg('mode', [['bank', t('tapBank')], ['rhythm', t('rhythm')], ['mixed', t('mixed')]], s.mode)}<div class="help">${t('modeHelp')}</div></div>
    <div class="field"><label>${t('speed')}</label>${seg('speed', [['off', t('off')], ['2', '2×'], ['4', '4×'], ['auto', t('auto')]], s.speed)}<div class="help">${t('speedHelp')}</div></div>
    <div class="field"><label>${t('tempo')}: <b id="bpmv">${s.bpm}</b></label><input type="range" min="50" max="180" step="5" value="${s.bpm}" data-act="bpm" aria-label="${t('tempo')}"></div>
  </div>`;
}

// ---------------------------------------------------------------- session control
export async function startSession(onlyIds = null) {
  const st = store.get();
  ensureAudio();
  const newUsed = await newUsedToday();
  const queue = buildQueue(st.mixes, st.progress, { newLimit: st.settings.newPerDay, newUsed, onlyIds });
  if (!queue.length) { toast(t('nothingDue')); return; }
  S = { queue, idx: 0, results: [], cur: null, raf: 0, timers: [], total: queue.length };
  document.addEventListener('keydown', onKey);
  view().onpointerdown = onPointer;
  store.set({ session: true, tab: 'practice' });
  nextCard();
}

export function endSession() {
  if (S) { cancelAnimationFrame(S.raf); S.timers.forEach(clearTimeout); }
  S = null;
  document.removeEventListener('keydown', onKey);
  view().onpointerdown = null;
  store.set({ session: false });
}

const fresh = id => store.get().progress.get(id);

function head() {
  const done = Math.min(S.idx, S.queue.length);
  return `<div class="sess-head"><div class="small muted">${Math.min(S.idx + 1, S.queue.length)} / ${S.queue.length}</div>
    <div class="pbar"><i style="width:${pct(done, S.queue.length)}%"></i></div>
    <button class="chip" data-act="s-quit">${t('quit')}</button></div>`;
}
function initLine(mix, s) {
  if (!mix.initiator && !mix.initiatorJp) return '';
  const jp = oshiSub(mix.initiatorJp || mix.initiator, s), ro = mix.initiator || '';
  const txt = s.script === 'romaji' ? ro : s.script === 'both' && ro && ro !== jp ? `${jp} · ${ro}` : jp;
  return `<div class="init">🔔 ${esc(txt)}</div>`;
}
function cue(item, extra = '') {
  const m = item.mix, s = store.get().settings;
  const p = fresh(m.id);
  return `<div class="cue"><h2>${esc(mixName(m))}</h2>
    <div class="tags" style="margin:6px 0"><span class="tag pink">${t('bars', { n: m.timing })}</span><span class="tag cy">${esc(trig(m))}</span>
    ${m.baisoku ? `<span class="tag">⚡ ${t('baisokuTag')}</span>` : ''}${p.status === STATUS.NOT_LEARNED ? `<span class="tag t1">★ ${t('newCards')}</span>` : ''}${extra}</div>
    ${initLine(m, s)}</div>`;
}
function stanzaHtml(mix, toks, ros, layout, cls = 'tok', s) {
  return rowsOf(toks.length, layout).map(st => `<div class="stanza">${st.map(r => `<div class="line">${r.map(i => tokHtml(toks[i], ros[i], s, cls)).join('')}</div>`).join('')}</div>`).join('');
}

function nextCard() {
  cancelAnimationFrame(S.raf);
  if (S.idx >= S.queue.length) return showDone();
  const item = S.queue[S.idx];
  S.cur = { item, studied: false };
  const p = fresh(item.mix.id);
  if (p.status === STATUS.NOT_LEARNED) renderStudy();
  else beginRecall();
}

function renderStudy() {
  const { item } = S.cur, m = item.mix, s = store.get().settings;
  const withExt = s.includeExt && m.extension?.length;
  view().innerHTML = `<div class="sess fadein">${head()}${cue(item)}
    <div class="panel"><div class="small muted" style="margin-bottom:6px">${t('study')} — ${t('studyHint')}</div>
      ${stanzaHtml(m, m.sequence, m.reading, m.layout, 'tok', s)}
      ${withExt ? `<div class="small muted">${t('extension')}</div>${stanzaHtml(m, m.extension, m.extReading, m.extLayout, 'tok ext', s)}` : ''}
    </div>
    ${m.notes?.length ? `<p class="notes">${m.notes.map(esc).join('<br>')}</p>` : ''}
    <div class="btns"><button class="btn primary block" data-act="s-ready">${t('ready')}</button><button class="btn block" data-act="s-skip">${t('skip')}</button></div></div>`;
}

function beginRecall() {
  const { item } = S.cur, s = store.get().settings, p = fresh(item.mix.id);
  const seq = seqFor(item.mix, s), ro = readingFor(item.mix, s);
  const mult = resolveSpeed(s.speed, item.mix, p);
  let mode = s.mode;
  if (mode === 'mixed') mode = p.status === STATUS.REMEMBERED || p.status === STATUS.MASTERED ? 'rhythm' : 'bank';
  Object.assign(S.cur, { seq, ro, mult, mode, bpm: s.bpm, hinted: false });
  if (mode === 'rhythm') renderRhythmIntro(); else renderBank();
}

// ---------------------------------------------------------------- tap bank
function slotHtml(i, c, s) {
  return `<span class="slot" data-i="${i}">·</span>`;
}
function renderBank() {
  const c = S.cur, s = store.get().settings, m = c.item.mix, p = fresh(m.id);
  c.bank = makeBank({ mix: m, seq: c.seq, vocab: getVocab(), siblings: getSiblings(m), status: p.status });
  Object.assign(c, { pos: 0, errors: 0, t0: 0, done: false });
  c.limit = c.mult > 1 ? Math.round(2500 + c.seq.length * tokenMs(c.bpm, c.mult) * 2.2) : 0;
  const lay = rowsOf(c.seq.length, c.item.mix.layout.length && c.seq.length === m.sequence.length ? m.layout : (s.includeExt ? [...m.layout, 0, ...m.extLayout] : m.layout));
  view().innerHTML = `<div class="sess fadein">${head()}${cue(c.item, c.mult > 1 ? `<span class="tag" style="color:var(--gold)">⚡ ${c.mult}×</span>` : '')}
    ${c.limit ? '<div class="timer"><i id="tbar"></i></div>' : ''}
    <div class="slots" id="slots" aria-label="${t('yourSeq')}">${lay.map(st => st.map(r => `<div class="line">${r.map(i => slotHtml(i)).join('')}</div>`).join('')).join('<div style="height:4px"></div>')}</div>
    <div class="row-actions"><span class="small muted">${t('bankTitle')} · ${t('tapStart')}</span><button class="chip" data-act="s-hint">💡 ${t('hint')}</button></div>
    <div class="bank" id="bank">${c.bank.map((b, k) => { const x = tokText(b.t, null, s); return `<button class="tile" data-act="tile" data-k="${k}"><span class="a">${esc(x.a)}</span>${x.b ? `<span class="b">${esc(x.b)}</span>` : ''}</button>`; }).join('')}</div></div>`;
  markCurSlot();
}
const slotEl = i => $(`#slots .slot[data-i="${i}"]`);
function markCurSlot() { $$('#slots .slot.cur').forEach(e => e.classList.remove('cur')); slotEl(S.cur.pos)?.classList.add('cur'); }

function tapTile(k, el) {
  const c = S.cur, s = store.get().settings;
  if (c.done) return;
  if (!c.t0) { c.t0 = performance.now(); if (c.limit) bankTimer(); }
  const tile = c.bank[k];
  if (tile.t === c.seq[c.pos]) {
    const sl = slotEl(c.pos), x = tokText(c.seq[c.pos], c.ro[c.pos], s);
    sl.classList.add('f'); sl.innerHTML = `<span class="a">${esc(x.a)}</span>${x.b ? `<span class="b">${esc(x.b)}</span>` : ''}`;
    c.pos++;
    if (s.sound) blip('ok');
    if (c.pos >= c.seq.length) return finishBank(true);
    markCurSlot();
    sl.nextElementSibling || sl.scrollIntoView?.({ block: 'nearest' });
  } else {
    c.errors++;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    if (s.sound) blip('wrong');
    if (s.haptics) buzz(40);
  }
}
function bankTimer() {
  const c = S.cur;
  const tick = () => {
    if (!S || S.cur !== c || c.done) return;
    const left = 1 - (performance.now() - c.t0) / c.limit;
    const bar = $('#tbar'); if (bar) bar.style.transform = `scaleX(${Math.max(0, left)})`;
    if (left <= 0) return finishBank(false, true);
    S.raf = requestAnimationFrame(tick);
  };
  S.raf = requestAnimationFrame(tick);
}
function hint() {
  const c = S.cur;
  if (!c || c.mode !== 'bank' || c.done) return;
  c.hinted = true;
  const k = c.bank.findIndex(b => b.t === c.seq[c.pos]);
  const el = $(`.tile[data-k="${k}"]`); if (el) { el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); }
}
function finishBank(completed, timeout = false) {
  const c = S.cur;
  if (c.done) return; c.done = true;
  cancelAnimationFrame(S.raf);
  const ms = c.t0 ? performance.now() - c.t0 : 0, n = c.seq.length;
  const grade = gradeRecall({ n, errors: c.errors, completed, progress: c.pos / n, hinted: c.hinted, elapsedMs: ms, parMs: parMs(n, c.bpm, c.mult) });
  if (S.cur.item.mix && store.get().settings.sound) blip(completed ? 'done' : 'wrong');
  record({ grade, mode: 'bank', ms, detail: { errors: c.errors, completed, timeout, n, pos: c.pos, hinted: c.hinted } });
}

// ---------------------------------------------------------------- rhythm mode
function renderRhythmIntro() {
  const c = S.cur, s = store.get().settings;
  view().innerHTML = `<div class="sess fadein">${head()}${cue(c.item, c.mult > 1 ? `<span class="tag" style="color:var(--gold)">⚡ ${c.mult}×</span>` : '')}
    <div class="panel"><p style="margin:0 0 6px"><b>${t('rhythm')}</b> · ${c.bpm} BPM${c.mult > 1 ? ` · ${c.mult}×` : ''}</p><p class="muted small" style="margin:0">${t('pickRight')}</p></div>
    <div class="btns"><button class="btn primary block" data-act="s-rstart">${t('go')}</button><button class="btn block" data-act="s-skip">${t('skip')}</button></div></div>`;
}
function startRhythm() {
  const c = S.cur, s = store.get().settings, m = c.item.mix;
  ensureAudio();
  const n = c.seq.length, beat = 60000 / c.bpm, tm = tokenMs(c.bpm, c.mult), lead = 450;
  const start = performance.now() + lead, T0 = start + 4 * beat;
  const vocab = getVocab(), sib = getSiblings(m);
  Object.assign(c, { n, beat, tm, start, T0, cur: -99, taken: [], judg: [], lastBeat: -1, done: false,
    opts: c.seq.map((_, i) => (c.seq[i] === '👏' ? [c.seq[i]] : makeOptions({ mix: m, seq: c.seq, i, vocab, siblings: sib }))) });
  if (s.sound) {
    const base = audioNow() + lead / 1000;
    const beats = 4 + Math.ceil((n * tm) / beat) + 2;
    for (let k = 0; k < beats; k++) click(base + (k * beat) / 1000, k % 4 === 0, k < 4 ? 0.3 : 0.14);
  }
  const lay = rowsOf(n, m.layout.length && n === m.sequence.length ? m.layout : []);
  view().innerHTML = `<div class="sess">${head()}<div class="cue" style="margin-bottom:4px"><h2>${esc(mixName(m))}</h2>${initLine(m, s)}</div>
    <div class="rh"><div class="metro" id="metro">…</div><div class="judge" id="judge"></div>
    <div class="slots" id="slots" style="width:100%;max-height:22dvh">${lay.map(st => st.map(r => `<div class="line">${r.map(i => slotHtml(i)).join('')}</div>`).join('')).join('<div style="height:4px"></div>')}</div>
    <div class="opts" id="opts"></div></div></div>`;
  S.raf = requestAnimationFrame(loopRhythm);
}
function loopRhythm(now) {
  const c = S.cur; if (!c || c.done) return;
  S.raf = requestAnimationFrame(loopRhythm);
  if (now >= c.start) {
    const bi = Math.floor((now - c.start) / c.beat);
    if (bi !== c.lastBeat) {
      c.lastBeat = bi;
      const mt = $('#metro');
      if (mt) {
        mt.classList.remove('beat', 'accent'); void mt.offsetWidth; mt.classList.add('beat'); if (bi % 4 === 0) mt.classList.add('accent');
        mt.textContent = bi < 4 ? String(bi + 1) : bi * c.beat < (c.T0 - c.start) + c.n * c.tm ? '♪' : '';
      }
    }
  }
  const cur = Math.floor((now - c.T0) / c.tm + 0.5);
  if (cur !== c.cur) {
    for (let i = Math.max(c.cur, 0); i < Math.min(cur, c.n); i++) finalizeSlot(i);
    c.cur = cur;
    if (cur >= c.n) return finishRhythm();
    if (cur >= 0) showOptions(cur);
  }
}
function showOptions(i) {
  const c = S.cur, s = store.get().settings;
  const box = $('#opts'); if (!box) return;
  box.innerHTML = c.opts[i].map((tk, k) => { const x = tokText(tk, null, s); return `<button class="opt" data-act="opt" data-k="${k}"><kbd>${k + 1}</kbd><span class="a">${esc(x.a)}</span>${x.b ? `<span class="b">${esc(x.b)}</span>` : ''}</button>`; }).join('');
  const sl = slotEl(i); sl?.classList.add('cur'); sl?.scrollIntoView?.({ block: 'nearest' });
}
function paintSlot(i, j) {
  const c = S.cur, s = store.get().settings, sl = slotEl(i); if (!sl) return;
  const x = tokText(c.seq[i], c.ro[i], s);
  sl.classList.remove('cur'); sl.classList.add('f', 'j-' + j);
  sl.innerHTML = `<span class="a">${esc(x.a)}</span>${x.b ? `<span class="b">${esc(x.b)}</span>` : ''}`;
}
function finalizeSlot(i) {
  const c = S.cur;
  if (c.taken[i]) return;
  c.taken[i] = true; c.judg[i] = 'miss';
  paintSlot(i, 'miss'); say('miss');
  if (store.get().settings.sound) blip('wrong');
}
function say(j, dt) {
  const el = $('#judge'); if (!el) return;
  const extra = dt != null && j !== 'perfect' && Math.abs(dt) > 25 ? ` <small>${dt < 0 ? t('early') : t('late')}</small>` : '';
  el.className = 'judge ' + j; el.innerHTML = t(j) + extra;
}
function tapOpt(k, el) {
  const c = S.cur, s = store.get().settings;
  if (!c || c.done || c.cur < 0 || c.cur >= c.n || c.taken[c.cur]) return;
  const i = c.cur, now = performance.now() - (s.latency || 0);
  const dt = now - (c.T0 + i * c.tm);
  c.taken[i] = true;
  const right = c.opts[i][k] === c.seq[i];
  const j = right ? judgeTap(dt, c.tm) : 'wrong';
  const jj = j === 'miss' ? 'ok' : j;
  c.judg[i] = right ? jj : 'wrong';
  el.classList.add(right ? 'right' : 'bad');
  if (!right) $$('.opt').forEach(o => { if (c.opts[i][+o.dataset.k] === c.seq[i]) o.classList.add('right'); });
  paintSlot(i, c.judg[i]); say(c.judg[i], dt);
  if (s.sound) blip(right ? (jj === 'perfect' ? 'perfect' : 'ok') : 'wrong');
  if (!right && s.haptics) buzz(40);
}
function finishRhythm() {
  const c = S.cur;
  if (c.done) return; c.done = true; cancelAnimationFrame(S.raf);
  const j = Array.from({ length: c.n }, (_, i) => c.judg[i] || 'miss');
  const grade = gradeRhythm(j);
  const counts = j.reduce((o, x) => (o[x] = (o[x] || 0) + 1, o), {});
  if (store.get().settings.sound) blip(grade >= 3 ? 'done' : 'wrong');
  record({ grade, mode: 'rhythm', ms: Math.round(c.n * c.tm), detail: { counts, n: c.n } });
}

// ---------------------------------------------------------------- results
async function record({ grade, mode, ms, detail }) {
  const c = S.cur, m = c.item.mix, prev = fresh(m.id);
  const next = applyGrade(prev, grade, Date.now(), ms);
  const progress = new Map(store.get().progress); progress.set(m.id, next);
  store.set({ progress });
  try { await saveProgress(next); await logReview({ mixId: m.id, ts: Date.now(), grade, mode, ms: Math.round(ms), speed: c.mult, bpm: c.bpm }); if (prev.status === STATUS.NOT_LEARNED) await bumpNew(); } catch (e) { console.warn(e); }
  S.results.push({ mix: m, grade, mode, prevStatus: prev.status, status: next.status });
  if (grade < 3 && !c.item.relearn) S.queue.push({ ...c.item, relearn: true });
  if (next.status === STATUS.MASTERED && prev.status !== STATUS.MASTERED) setTimeout(() => toast(t('masteredToast'), 3200), 400);
  renderResult({ grade, next, detail, ms, mode });
}
const nextText = p => (p.interval === 0 ? t('minutes10') : getLang() === 'ja' ? `${p.interval}${t('days')}` : `${p.interval} ${p.interval === 1 ? t('day') : t('days')}`);
function renderResult({ grade, next, detail, ms, mode }) {
  const c = S.cur, m = c.item.mix;
  const last = S.idx + 1 >= S.queue.length;
  let stats;
  if (mode === 'bank') {
    const acc = pct(detail.n, detail.n + detail.errors);
    stats = `<div class="stat"><b>${acc}%</b><span>${t('accuracy')}</span></div><div class="stat"><b>${detail.errors}</b><span>${t('errors')}</span></div><div class="stat"><b>${fmtMs(ms)}</b><span>${t('time')}</span></div><div class="stat"><b>${nextText(next)}</b><span>${t('nextReview')}</span></div>`;
  } else {
    const k = detail.counts;
    stats = `<div class="stat"><b class="g5">${k.perfect || 0}</b><span>${t('perfect')}</span></div><div class="stat"><b class="g3">${(k.good || 0) + (k.ok || 0)}</b><span>${t('good')}/${t('ok')}</span></div><div class="stat"><b class="g1">${(k.miss || 0) + (k.wrong || 0)}</b><span>${t('miss')}</span></div><div class="stat"><b>${nextText(next)}</b><span>${t('nextReview')}</span></div>`;
  }
  view().innerHTML = `<div class="sess fadein">${head()}<div class="result">
    <div class="small muted">${esc(mixName(m))}${detail.timeout ? ' · ' + t('timeUp') : ''}</div>
    <div class="gradebig">${grade}</div><div class="gradename g${grade}">${t('gradeNames' + grade)}</div>
    <div class="panel"><div class="stats4">${stats}</div></div>
    <div class="panel" style="text-align:left">${stanzaHtml(m, c.seq, c.ro, m.layout.length && c.seq.length === m.sequence.length ? m.layout : [], 'tok', store.get().settings)}</div>
    <div class="btns" style="justify-content:center"><button class="btn primary" data-act="s-next">${last && !S.queue.slice(S.idx + 1).length ? t('finish') : t('next')}</button></div></div></div>`;
}
function showDone() {
  const r = S.results, avg = r.length ? r.reduce((a, x) => a + x.grade, 0) / r.length : 0;
  view().innerHTML = `<div class="sess fadein"><div class="result"><h2>${t('sessionDone')}</h2>
    <div class="gradebig">${avg.toFixed(1)}</div><div class="gradename">${t('avgGrade')}</div>
    <div class="revlist">${r.map(x => `<div class="it"><span>${esc(mixName(x.mix))}</span><b class="g${x.grade}">${x.grade}${x.prevStatus === STATUS.NOT_LEARNED ? ' ★' : ''}${x.status === STATUS.MASTERED && x.prevStatus !== STATUS.MASTERED ? ' ✨' : ''}</b></div>`).join('')}</div>
    <div class="btns" style="justify-content:center"><button class="btn primary" data-act="s-quit">${t('close')}</button></div></div></div>`;
}

// ---------------------------------------------------------------- input routing
function onPointer(e) {
  const b = e.target.closest('[data-act]');
  if (!b || !S) return;
  const act = b.dataset.act;
  if (act === 'tile' && S.cur?.mode === 'bank') { e.preventDefault(); tapTile(+b.dataset.k, b); }
  else if (act === 'opt' && S.cur?.mode === 'rhythm') { e.preventDefault(); tapOpt(+b.dataset.k, b); }
}
function onKey(e) {
  if (!S || !S.cur) return;
  if (S.cur.mode === 'rhythm' && /^[1-4]$/.test(e.key)) { const b = $(`.opt[data-k="${+e.key - 1}"]`); if (b) tapOpt(+e.key - 1, b); }
}

/** click-driven session actions */
export function practiceAction(act, el) {
  switch (act) {
    case 's-start': startSession(); return true;
    case 's-quit': endSession(); store.set({ tab: 'practice' }); return true;
    case 's-ready': S.cur.item.studied = true; beginRecall(); return true;
    case 's-hint': hint(); return true;
    case 's-rstart': startRhythm(); return true;
    case 's-skip': S.idx++; nextCard(); return true;
    case 's-next': S.idx++; nextCard(); return true;
    case 'tile': case 'opt': return true; // handled on pointerdown
    case 'set': { const k = el.dataset.k; updateSettings({ [k]: el.dataset.v === 'off' || isNaN(+el.dataset.v) ? el.dataset.v : +el.dataset.v }).then(renderSetup); return true; }
  }
  return false;
}
export function onBpmInput(el) { $('#bpmv').textContent = el.value; }
export function onBpmChange(el) { updateSettings({ bpm: +el.value }); }
