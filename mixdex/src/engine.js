import { rowsOf } from './parse.js';
// Quiz engine helpers: queue building, speed (baisoku) resolution, banks and rhythm options.
import { STATUS, isDue } from './srs.js';
import { distractors } from './interference.js';

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const seqFor = (mix, settings) => (settings.includeExt && mix.extension?.length ? [...mix.sequence, ...mix.extension] : mix.sequence.slice());
export const readingFor = (mix, settings) => (settings.includeExt && mix.extension?.length ? [...mix.reading, ...mix.extReading] : mix.reading.slice());

export const tokenMs = (bpm, mult) => 60000 / bpm / mult;
export const parMs = (n, bpm, mult) => Math.round(3000 + n * tokenMs(bpm, mult) * 2);

/** Baisoku: 'off' | 2 | 4 | 'auto'. Auto escalates for advanced / baisoku-tagged mixes once they're comfortable. */
export function resolveSpeed(setting, mix, progress) {
  if (setting === 'auto') {
    if (!(mix.baisoku || mix.category === 'Advanced')) return 1;
    const s = progress?.streak || 0;
    const cap = mix.baisoku === 4 ? 4 : 2;
    return s >= 6 && cap === 4 ? 4 : s >= 3 ? 2 : 1;
  }
  return setting === 'off' || !setting ? 1 : +setting;
}

/** Due reviews first (most overdue first), then new mixes in codex order up to newLimit. */
export function buildQueue(mixes, progressMap, { now = Date.now(), newLimit = 5, newUsed = 0, max = 30, onlyIds = null } = {}) {
  const due = [], fresh = [];
  for (const m of mixes) {
    if (!onlyIds && (m.excerptOf || m.sourcePending)) continue;
    if (onlyIds && !onlyIds.includes(m.id)) continue;
    const p = progressMap.get(m.id);
    if (!p) continue;
    if (onlyIds) { due.push({ mix: m, progress: p, isNew: p.status === STATUS.NOT_LEARNED }); continue; }
    if (p.status === STATUS.NOT_LEARNED) fresh.push({ mix: m, progress: p, isNew: true });
    else if (isDue(p, now)) due.push({ mix: m, progress: p, isNew: false });
  }
  if (!onlyIds) due.sort((a, b) => a.progress.due - b.progress.due);
  const room = Math.max(0, newLimit - newUsed);
  const q = [...due, ...(onlyIds ? [] : fresh.slice(0, room))];
  return q.slice(0, max);
}

export function countQueue(mixes, progressMap, opts) {
  const now = opts.now ?? Date.now();
  let due = 0, fresh = 0;
  for (const m of mixes) {
    if (m.excerptOf || m.sourcePending) continue;
    const p = progressMap.get(m.id);
    if (!p) continue;
    if (p.status === STATUS.NOT_LEARNED) fresh++;
    else if (isDue(p, now)) due++;
  }
  return { due, fresh: Math.min(fresh, Math.max(0, (opts.newLimit ?? 5) - (opts.newUsed ?? 0))), freshTotal: fresh };
}

/** Extra decoys scale with mastery: more interference as you get better. */
export const decoyCount = (n, status) => {
  const base = { NOT_LEARNED: 2, LEARNING: 3, REMEMBERED: 5, MASTERED: 7 }[status] ?? 3;
  return base + (n > 16 ? 2 : 0);
};

/** Tap-bank: one reusable tile per distinct token + interference decoys (never equal to a real token). */
export function makeBank({ mix, seq, vocab, siblings, status, rng = Math.random }) {
  const real = [...new Set(seq)];
  const exclude = new Set(real);
  const decoys = new Set();
  const want = decoyCount(seq.length, status);
  // target decoys at tokens in the sequence, rotating through them
  const picks = shuffle(real.filter(t => t !== '👏'), rng);
  for (let i = 0; decoys.size < want && i < picks.length * 3; i++) {
    const t = picks[i % picks.length];
    const ds = distractors({ mix, target: t, vocab, siblings, n: 1 + Math.floor(i / picks.length), exclude: new Set([...exclude, ...decoys]), rng, fromOwn: false });
    if (ds.length) decoys.add(ds[ds.length - 1]);
    if (i > 60) break;
  }
  const tiles = [...real.map(t => ({ t, decoy: false })), ...[...decoys].map(t => ({ t, decoy: true }))];
  return shuffle(tiles, rng);
}

/** Rhythm mode: choices for one slot — the right word + 3 decoys */
export function makeOptions({ mix, seq, i, vocab, siblings, rng = Math.random, count = 4 }) {
  const target = seq[i];
  const ds = distractors({ mix, target, vocab, siblings, n: count - 1, exclude: new Set(), rng, fromOwn: true });
  return shuffle([target, ...ds], rng);
}

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function chantLines(mix) {
  return rowsOf(mix.sequence.length, mix.layout).flat().map(indices => ({ tokens: indices.map(i => mix.sequence[i]), readings: indices.map(i => mix.reading[i]) }));
}
export function lineExercises(queue, mixes, { mode = 'choice', limit = 3, rng = Math.random } = {}) {
  const catalog = mixes.filter(m => !m.excerptOf && !m.sourcePending).flatMap(chantLines);
  const key = line => line.tokens.join(' ');
  return queue.flatMap(item => {
    const lines = chantLines(item.mix);
    const count = mode === 'lines' || !limit ? lines.length : Math.min(limit, lines.length);
    const first = Math.floor(rng() * (lines.length - count + 1));
    const positions = Array.from({ length: count }, (_, i) => first + i);
    return positions.map(index => {
      const answer = lines[index], context = lines.slice(Math.max(0, index - 2), index), seen = new Set([answer, ...context].map(key));
      const alternatives = mode === 'lines' ? [] : [...lines.slice(index + 1), ...lines.slice(0, index).reverse(), ...catalog].filter(line => { const k = key(line); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
      return { mix: item.mix, index, total: lines.length, context, answer, options: shuffle([answer, ...alternatives], rng) };
    });
  });
}
