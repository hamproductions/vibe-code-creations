import { toHiragana } from '../vendor/wanakana.mjs';
import { store } from './state.js';
import { saveProgress, logReview, savePracticeResults, getMeta, setMeta } from './db.js';
import { STATUS, STATUS_ORDER, applyGrade } from './srs.js';
import { buildQueue, countQueue, dayKey, lineExercises } from './engine.js';
import { esc, $, tokHtml, rowsOf, mixName, mixSub, trig, toast, learningNotes, statusBadge, catalogFilters } from './ui.js';
import { t } from './i18n.js';

let S = null;
let quizSize = 1;
let practiceMode = 'choice';
let lineLimit = 3;
const selected = new Set();
const picker = { q: '', status: STATUS.LEARNING, cat: 'all', tier: 'all' };
export const sessionActive = () => !!S;
const view = () => $('#view');
const RATINGS = [
  { key: 'again', hint: 'againHelp', grade: 0, status: STATUS.LEARNING, days: 0 },
  { key: 'markLearning', hint: 'learningHelp', grade: 3, status: STATUS.LEARNING, days: 1 },
  { key: 'markKnown', hint: 'learnedHelp', grade: 4, status: STATUS.REMEMBERED, days: 3 },
  { key: 'markMastered', hint: 'masteredHelp', grade: 5, status: STATUS.MASTERED, days: 30 },
];

async function newUsedToday() {
  const v = await getMeta('newToday');
  return v?.day === dayKey() ? v.count : 0;
}

export async function renderSetup() {
  const st = store.get(), newUsed = await newUsedToday();
  if (store.get().session || store.get().tab !== 'practice') return;
  const c = countQueue(st.mixes, st.progress, { newLimit: 0, newUsed });
  const queue = buildQueue(st.mixes, st.progress, { newLimit: 0, newUsed, max: quizSize });
  view().innerHTML = `<div class="practice-home fadein">
    <div class="page-heading"><h1>${t('chooseMix')}</h1><p class="muted">${t('chooseMixHelp')}</p></div>
    <div class="practice-mode"><div class="mode-field"><label for="practice-mode">${t('mode')}</label><select class="input" id="practice-mode">${[['choice', 'multipleChoice'], ['lines', 'lineFlashcards'], ['flashcard', 'fullChantRecall']].map(([value, label]) => `<option value="${value}" ${practiceMode === value ? 'selected' : ''}>${t(label)}</option>`).join('')}</select></div>${practiceMode === 'choice' ? `<div class="mode-field"><label for="line-limit">${t('questionsPerMix')}</label><select class="input" id="line-limit">${[1, 3, 5].map(n => `<option value="${n}" ${lineLimit === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>` : ''}<p class="small muted">${t(practiceMode === 'choice' ? 'choiceModeHelp' : practiceMode === 'lines' ? 'lineModeHelp' : 'recallIntro')}</p></div>
    <div class="practice-picker-layout"><section class="practice-picker">
      <input class="input" id="practice-q" type="search" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" value="${esc(picker.q)}">
      <div id="practice-status" class="status-filter" role="group" aria-label="${t('yourProgress')}"></div>
      ${catalogFilters('practice', picker)}
      <div class="picker-summary"><span id="practice-count" class="small muted"></span><button class="chip" data-act="p-reset">${t('clearFilters')}</button></div>
      <div id="practice-list" class="practice-list"></div>
    </section><aside class="practice-selection">
      <details class="panel selection-summary" ${innerWidth >= 960 ? 'open' : ''}><summary id="selection-title">${t('selectedMix')}</summary><div id="practice-selected"></div></details><div id="practice-actions" class="practice-actions"></div>
      <details class="panel review-plan"><summary>${t('dailyReview')} · ${c.due}</summary><p class="muted">${t('reviewPlan', { due: c.due })}</p>
        <label for="quiz-size">${t('quizSize')}</label><select id="quiz-size" class="input">${[1, 3, 5].map(n => `<option value="${n}" ${n === quizSize ? 'selected' : ''}>${t('quizCount', { n })}</option>`).join('')}</select>
        ${queue.length ? `<ol class="queue-preview">${queue.map(item => `<li>${esc(mixName(item.mix))}</li>`).join('')}</ol>` : `<p class="small muted">${t('nothingDue')}</p>`}
        <button class="btn block" data-act="s-start" ${queue.length ? '' : 'disabled'}>${t('startFlashcards')}</button><p class="small muted">${t('sessionLimit')}</p>
      </details>
    </aside></div>
  </div>`;
  renderPicker();
}

function renderPicker() {
  const st = store.get();
  const available = st.mixes.filter(m => !m.excerptOf && !m.sourcePending);
  const ids = new Set(available.map(m => m.id));
  for (const id of selected) if (!ids.has(id)) selected.delete(id);
  const query = picker.q.trim().toLowerCase(), q = toHiragana(query);
  const list = available.filter(m => {
    if (picker.status !== 'all' && st.progress.get(m.id).status !== picker.status) return false;
    if (picker.cat !== 'all' && m.category !== picker.cat) return false;
    if (picker.tier !== 'all' && m.tier !== +picker.tier) return false;
    const text = [m.name, m.jp, m.slug, ...(m.aliases || []), ...m.sequence, ...m.reading].join(' ').toLowerCase();
    return !q || text.includes(query) || toHiragana(text).includes(q);
  });
  $('#practice-status').innerHTML = ['all', ...STATUS_ORDER].map(status => `<button class="status-choice ${picker.status === status ? 'on' : ''}" data-act="p-status" data-v="${status}" aria-pressed="${picker.status === status}">${status === 'all' ? t('all') : t(status)}<span>${status === 'all' ? available.length : available.filter(m => st.progress.get(m.id).status === status).length}</span></button>`).join('');
  $('#practice-count').textContent = t('pickerCount', { n: list.length });
  $('#practice-list').innerHTML = list.length ? list.map(m => `<div class="practice-item ${selected.has(m.id) ? 'chosen' : ''}"><label><input type="checkbox" data-practice-id="${m.id}" ${selected.has(m.id) ? 'checked' : ''}><span><b>${esc(mixName(m))}</b>${statusBadge(st.progress.get(m.id).status)}<span class="small muted">${t(m.category)}${m.timing ? ' · ' + t('bars', { n: m.timing }) : ''}</span></span></label><button class="chip" data-act="open" data-id="${m.id}">${t('viewChant')}</button></div>`).join('') : `<div class="empty">${t('empty')}</div>`;
  const chosen = available.filter(m => selected.has(m.id));
  $('#selection-title').textContent = t('selectedMix') + ' · ' + chosen.length;
  $('#practice-actions').innerHTML = `<button class="btn primary block" data-act="p-start" ${chosen.length ? '' : 'disabled'}>${t('practiceSelected', { n: chosen.length })}</button>`;
  $('#practice-selected').innerHTML = `<p class="selection-count">${t('selected', { n: chosen.length })}</p>${chosen.length ? `<ul class="selected-mixes">${chosen.map(m => `<li><span>${esc(mixName(m))}</span><button data-act="p-remove" data-id="${m.id}" aria-label="${esc(t('removeSelection', { name: mixName(m) }))}">×</button></li>`).join('')}</ul>` : `<p class="small muted">${t('selectionEmpty')}</p>`}${chosen.length ? `<button class="chip" data-act="p-clear">${t('selNone')}</button>` : ''}`;
}

export async function startSession(onlyIds = null) {
  if (S) return;
  const st = store.get(), newUsed = await newUsedToday();
  if (S) return;
  if (onlyIds) onlyIds = [...new Set(onlyIds.map(id => { const m = st.mixes.find(m => m.id === id); return m?.excerptOf ? st.mixes.find(parent => parent.slug === m.excerptOf).id : id; }))];
  const queue = buildQueue(st.mixes, st.progress, { newLimit: 0, newUsed, onlyIds, max: onlyIds ? onlyIds.length : quizSize });
  if (!queue.length) { toast(t('nothingDue')); return; }
  S = { queue, mode: practiceMode, units: practiceMode === 'flashcard' ? [] : lineExercises(queue, st.mixes, { mode: practiceMode, limit: lineLimit }), idx: 0, results: [], phase: '', saving: false, cur: null };
  document.addEventListener('keydown', onKey);
  store.set({ session: true, tab: 'practice' });
  nextCard();
}

export function endSession() {
  S = null;
  document.removeEventListener('keydown', onKey);
  store.set({ session: false });
}

export function refreshSession() {
  if (!S || S.saving) return;
  if (S.phase === 'done') showDone();
  else if (S.mode !== 'flashcard') renderLineExercise();
  else renderCard(S.phase);
}

function head() {
  return `<div class="sess-head"><span class="small muted">${t('cardPosition', { n: S.idx + 1, total: S.mode === 'flashcard' ? S.queue.length : S.units.length })}</span>
    <button class="chip" data-act="s-quit">${t('quit')}</button></div>`;
}

function chant(toks, ros, layout) {
  return rowsOf(toks.length, layout).map(st => `<div class="stanza">${st.map(r => `<div class="line">${r.map(i => tokHtml(toks[i], ros[i], store.get().settings)).join('')}</div>`).join('')}</div>`).join('');
}

function nextCard() {
  if (S.mode !== 'flashcard') {
    if (S.idx >= S.units.length) return finishLineExercises();
    S.cur = S.units[S.idx]; S.phase = S.mode; S.answerIndex = null; renderLineExercise(); return;
  }
  if (S.idx >= S.queue.length) return showDone();
  S.cur = S.queue[S.idx];
  const p = store.get().progress.get(S.cur.mix.id);
  renderCard(p.status === STATUS.NOT_LEARNED ? 'study' : 'recall');
}

function exerciseLine(line) {
  return `<div class="line">${line.tokens.map((token, i) => tokHtml(token, line.readings[i], store.get().settings)).join('')}</div>`;
}
function renderLineExercise() {
  const unit = S.cur, feedback = S.phase === 'line-feedback', revealed = S.phase === 'line-reveal';
  const correct = feedback && S.cur.options[S.answerIndex] === S.cur.answer;
  view().innerHTML = `<div class="sess flash-session">${head()}<article class="flashcard">
    <div class="flash-heading"><span class="small muted">${t(S.mode === 'choice' ? 'multipleChoice' : 'lineFlashcards')} · ${t('linePosition', { n: unit.index + 1, total: unit.total })}</span><h1>${esc(mixName(unit.mix))}</h1></div>
    <section class="line-context"><p class="small muted">${t(unit.index ? 'previousLines' : 'firstLine')}</p>${unit.context.map(exerciseLine).join('')}</section>
    ${S.mode === 'choice' ? `<h2>${t(unit.index ? 'chooseNextLine' : 'chooseFirstLine')}</h2><div class="line-options">${unit.options.map((option, index) => `<button class="line-option ${feedback && option === unit.answer ? 'correct' : feedback && index === S.answerIndex ? 'incorrect' : ''}" data-act="s-choice" data-v="${index}" ${feedback ? 'disabled' : ''}><span class="option-number">${index + 1}</span>${exerciseLine(option)}${feedback && option === unit.answer ? `<span class="answer-label">${t('correctAnswer')}</span>` : ''}</button>`).join('')}</div>${feedback ? `<p class="answer-feedback" role="status">${t(correct ? 'correctAnswer' : 'incorrectAnswer')}</p><button class="btn primary block" data-act="s-line-next">${t(S.idx + 1 === S.units.length ? 'finishQuiz' : 'next')}</button>` : ''}` : `<p>${t('recallLine')}</p>${revealed ? `<div class="flash-answer">${exerciseLine(unit.answer)}</div><div class="btns"><button class="btn" data-act="s-line-grade" data-v="0">${t('lineForgot')}</button><button class="btn primary" data-act="s-line-grade" data-v="1">${t('lineRemembered')}</button></div>` : `<button class="btn primary block" data-act="s-line-reveal">${t('showLine')}</button>`}`}
    </article></div>`;
  window.scrollTo(0, 0);
}
function advanceLine(correct) {
  S.results.push({ mix: S.cur.mix, correct }); S.idx++; nextCard();
}
async function finishLineExercises() {
  const session = S;
  session.saving = true; session.phase = 'line-saving';
  view().innerHTML = `<div class="panel" role="status">${t('savingResults')}</div>`;
  const totals = new Map();
  for (const result of session.results) {
    if (!totals.has(result.mix.id)) totals.set(result.mix.id, { mix: result.mix, correct: 0, total: 0 });
    const total = totals.get(result.mix.id); total.total++; total.correct += result.correct ? 1 : 0;
  }
  try {
    const progressRows = [], reviews = [], now = Date.now();
    for (const result of totals.values()) {
      const prev = store.get().progress.get(result.mix.id);
      const grade = Math.round(result.correct / result.total * 5), interval = prev.interval || 1;
      progressRows.push({ ...prev, status: prev.status === STATUS.NOT_LEARNED ? STATUS.LEARNING : prev.status, interval, due: now + interval * 86400000, lastReviewed: now, reviews: (prev.reviews || 0) + 1, lastGrade: grade });
      reviews.push({ mixId: result.mix.id, ts: now, grade, mode: session.mode, ms: 0 });
    }
    await savePracticeResults(progressRows, reviews);
    const progress = new Map(store.get().progress);
    for (const row of progressRows) progress.set(row.mixId, row);
    store.set({ progress });
  } catch (e) {
    if (S === session) { session.saving = false; view().innerHTML = `<div class="panel"><p>${t('progressSaveError')}</p><button class="btn" data-act="s-save-lines">${t('retrySave')}</button></div>`; }
    console.error(e); return;
  }
  if (S !== session) return;
  session.saving = false; session.phase = 'done'; showDone();
}
function showLineDone() {
  const totals = new Map();
  for (const result of S.results) {
    if (!totals.has(result.mix.id)) totals.set(result.mix.id, { mix: result.mix, correct: 0, total: 0 });
    const total = totals.get(result.mix.id); total.total++; total.correct += result.correct ? 1 : 0;
  }
  view().innerHTML = `<div class="flash-session"><section class="panel"><h1>${t('sessionDone')}</h1><div class="revlist">${[...totals.values()].map(result => `<div class="it"><span>${esc(mixName(result.mix))}</span><b>${result.correct} / ${result.total}</b></div>`).join('')}</div><p class="small muted">${t('lineProgressHelp')}</p><div class="btns"><button class="btn primary" data-act="s-quit">${t('backToPractice')}</button></div></section></div>`;
}

function renderCard(phase) {
  S.phase = phase;
  const m = S.cur.mix, s = store.get().settings, visible = phase !== 'recall';
  const start = m.initiatorJp || m.initiator;
  view().innerHTML = `<div class="sess flash-session">${head()}
    <article class="flashcard"><div class="flash-heading"><span class="small muted">${t(phase === 'study' ? 'study' : phase === 'recall' ? 'recallPrompt' : 'checkRecall')}</span>
      <h1>${esc(mixName(m))}</h1><p class="muted">${esc(mixSub(m))}</p>
      ${m.trigger_context ? `<p class="flash-context">${esc(trig(m))}</p>` : ''}</div>
      ${visible ? `<div class="flash-answer">${start ? `<div class="init">${tokHtml(start, m.initiator, s)}</div>` : ''}
        ${chant(m.sequence, m.reading, m.layout)}
        ${m.extension?.length ? `<p class="small muted">${t('longerVariantHelp')}</p>` : ''}
        ${learningNotes(m).length ? `<p class="notes">${learningNotes(m).map(esc).join('<br>')}</p>` : ''}</div>` : `<div class="recall-space"><p>${t('recallInstruction')}</p><span class="small muted">${t('recallNoTimer')}</span></div>`}
      ${phase === 'study' ? `<p class="muted">${t('fullStudyHint')}</p><button class="btn primary block" data-act="s-ready">${t('tryRecall')}</button>` : phase === 'recall' ? `<button class="btn primary block" data-act="s-reveal">${t('showChant')}</button>` : `<div class="assessment"><p>${t('assessmentPrompt')}</p><div class="rating-grid">${RATINGS.map((r, i) => `<button class="rating" data-act="s-rate" data-v="${i}"><span><kbd>${i + 1}</kbd><b>${t(r.key)}</b></span><span class="small muted">${t(r.hint)}</span></button>`).join('')}</div></div>`}
    </article><p class="small muted shortcut">${t(phase === 'reveal' ? 'ratingKeys' : 'revealKey')}</p></div>`;
  window.scrollTo(0, 0);
}

async function rate(index) {
  if (!S || S.phase !== 'reveal' || S.saving) return;
  const rating = RATINGS[index];
  if (!rating) return;
  const session = S, m = session.cur.mix, prev = store.get().progress.get(m.id), now = Date.now();
  session.saving = true;
  view().querySelectorAll('[data-act="s-rate"]').forEach(b => { b.disabled = true; });
  const next = { ...applyGrade(prev, rating.grade, now), status: rating.status, interval: rating.days, due: now + (rating.days ? rating.days * 86400000 : 600000) };
  try {
    await saveProgress(next);
    await logReview({ mixId: m.id, ts: now, grade: rating.grade, mode: 'flashcard', ms: 0 });
    if (prev.status === STATUS.NOT_LEARNED) await setMeta('newToday', { day: dayKey(), count: (await newUsedToday()) + 1 });
  } catch (e) {
    if (S === session) {
      session.saving = false;
      view().querySelectorAll('[data-act="s-rate"]').forEach(b => { b.disabled = false; });
      toast(t('progressSaveError'));
    }
    console.error(e);
    return;
  }
  const progress = new Map(store.get().progress); progress.set(m.id, next);
  store.set({ progress });
  if (S !== session) return;
  session.results.push({ mix: m, rating: index });
  session.idx++;
  session.saving = false;
  nextCard();
}

function showDone() {
  if (S.mode !== 'flashcard') return showLineDone();
  S.phase = 'done';
  const latest = new Map(S.results.map(r => [r.mix.id, r]));
  view().innerHTML = `<div class="flash-session"><section class="panel"><h1>${t('sessionDone')}</h1>
    <p class="muted">${t('sessionDoneHelp')}</p><div class="revlist">${[...latest.values()].map(r => `<div class="it"><span>${esc(mixName(r.mix))}</span><b>${t(RATINGS[r.rating].key)}</b></div>`).join('')}</div>
    <div class="btns">${[...latest.values()].some(r => r.rating === 0) ? `<button class="btn primary" data-act="s-retry">${t('retryMissed')}</button>` : ''}<button class="btn" data-act="s-quit">${t('backToPractice')}</button><button class="btn" data-act="tab" data-v="codex">${t('browseLibrary')}</button></div></section></div>`;
}

function onKey(e) {
  if (!S || S.saving || e.repeat || e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return;
  if (S.mode !== 'flashcard') {
    if (S.mode === 'choice' && S.phase === 'choice' && /^[1-4]$/.test(e.key)) { e.preventDefault(); chooseLine(+e.key - 1); }
    else if (e.code === 'Space' && S.mode === 'lines' && S.phase === 'lines') { e.preventDefault(); S.phase = 'line-reveal'; renderLineExercise(); }
    return;
  }
  if (e.code === 'Space' && ['study', 'recall'].includes(S.phase)) { e.preventDefault(); renderCard(S.phase === 'study' ? 'recall' : 'reveal'); }
  else if (S.phase === 'reveal' && /^[1-4]$/.test(e.key)) { e.preventDefault(); rate(+e.key - 1); }
}

function chooseLine(index) {
  if (!S || S.phase !== 'choice' || !S.cur.options[index]) return;
  S.answerIndex = index; S.phase = 'line-feedback'; renderLineExercise();
}

export function practiceAction(act, el) {
  if (act === 'p-status') { picker.status = el.dataset.v; renderPicker(); return true; }
  if (act === 'p-remove') { selected.delete(el.dataset.id); renderPicker(); return true; }
  if (act === 'p-clear') { selected.clear(); renderPicker(); return true; }
  if (act === 'p-reset') { Object.assign(picker, { q: '', status: STATUS.LEARNING, cat: 'all', tier: 'all' }); renderSetup(); return true; }
  if (act === 'p-start') { if (selected.size) startSession(store.get().mixes.filter(m => selected.has(m.id)).map(m => m.id)); return true; }
  if (act === 's-retry' && S?.phase === 'done') {
    const ids = [...new Map(S.results.map(r => [r.mix.id, r])).values()].filter(r => r.rating === 0).map(r => r.mix.id);
    endSession(); startSession(ids); return true;
  }
  if (act === 's-start') { startSession(); return true; }
  if (act === 's-quit') { endSession(); store.set({ tab: 'practice' }); return true; }
  if (!S) return false;
  if (act === 's-choice') { chooseLine(+el.dataset.v); return true; }
  if (act === 's-line-next' && S.phase === 'line-feedback') { advanceLine(S.cur.options[S.answerIndex] === S.cur.answer); return true; }
  if (act === 's-line-reveal' && S.phase === 'lines') { S.phase = 'line-reveal'; renderLineExercise(); return true; }
  if (act === 's-line-grade' && S.phase === 'line-reveal') { advanceLine(el.dataset.v === '1'); return true; }
  if (act === 's-save-lines' && !S.saving) { finishLineExercises(); return true; }
  if (act === 's-ready' && S.phase === 'study') { renderCard('recall'); return true; }
  if (act === 's-reveal' && S.phase === 'recall') { renderCard('reveal'); return true; }
  if (act === 's-rate') { rate(+el.dataset.v); return true; }
  return false;
}

document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'practice-mode') { practiceMode = el.value; renderSetup(); }
  else if (el.id === 'line-limit') { lineLimit = +el.value; }
  else if (el.id === 'quiz-size') { quizSize = +el.value; renderSetup(); }
  else if (el.dataset.practiceId) { el.checked ? selected.add(el.dataset.practiceId) : selected.delete(el.dataset.practiceId); renderPicker(); }
  else if (el.id === 'practice-cat' || el.id === 'practice-tier') { picker[el.id.slice(9)] = el.value; renderPicker(); }
});
document.addEventListener('input', e => { if (e.target.id === 'practice-q') { picker.q = e.target.value; renderPicker(); } });

matchMedia('(max-width: 959px)').addEventListener('change', () => { if (store.get().tab === 'practice' && !store.get().session) renderSetup(); });
