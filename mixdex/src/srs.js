// Spaced-repetition (SM-2 flavoured) + grading for MIXDEX
export const STATUS = { NOT_LEARNED: 'NOT_LEARNED', LEARNING: 'LEARNING', REMEMBERED: 'REMEMBERED', MASTERED: 'MASTERED' };
export const STATUS_ORDER = [STATUS.NOT_LEARNED, STATUS.LEARNING, STATUS.REMEMBERED, STATUS.MASTERED];
export const STATUS_LABEL = { NOT_LEARNED: 'Locked', LEARNING: 'Learning', REMEMBERED: 'Remembered', MASTERED: 'Mastered' };
const DAY = 86400000, MIN = 60000;

export function newProgress(mixId) {
  return { mixId, status: STATUS.NOT_LEARNED, interval: 0, easeFactor: 2.5, streak: 0, due: 0, lastReviewed: 0, reviews: 0, lapses: 0, lastGrade: null, bestMs: null };
}

export const isDue = (p, now = Date.now()) => p.status !== STATUS.NOT_LEARNED && p.due <= now;

export function statusFor(p) {
  if (p.lapsedNow) return STATUS.LEARNING;
  if (p.interval >= 21 && p.streak >= 4) return STATUS.MASTERED;
  if (p.interval >= 3 && p.streak >= 2) return STATUS.REMEMBERED;
  return STATUS.LEARNING;
}

// q: 0..5 → next progress record
export function applyGrade(prev, q, now = Date.now(), ms = null) {
  const p = { ...prev };
  p.reviews = (p.reviews || 0) + 1;
  p.lastReviewed = now;
  p.lastGrade = q;
  if (ms != null && q >= 4 && (p.bestMs == null || ms < p.bestMs)) p.bestMs = ms;
  p.easeFactor = Math.max(1.3, +(p.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)).toFixed(3));
  if (q < 3) {
    if (p.status !== STATUS.NOT_LEARNED) p.lapses = (p.lapses || 0) + 1;
    p.streak = 0;
    p.interval = 0;
    p.due = now + 10 * MIN;
    p.status = STATUS.LEARNING;
    return p;
  }
  p.streak += 1;
  if (p.interval === 0) p.interval = 1;
  else if (p.interval === 1) p.interval = q === 3 ? 2 : 3;
  else p.interval = Math.max(p.interval + 1, Math.round(p.interval * p.easeFactor * (q === 3 ? 0.85 : q === 5 ? 1.15 : 1)));
  p.due = now + p.interval * DAY;
  p.status = statusFor(p);
  return p;
}

// preview of next interval for each possible outcome (UI hint)
export function describeInterval(p) {
  if (p.interval === 0) return '10 min';
  return p.interval + (p.interval === 1 ? ' day' : ' days');
}

/**
 * Recall grading (tap bank): accuracy + speed.
 * errors: wrong taps; completed: whole sequence entered; progress: 0..1 when not completed
 * hinted: used hint; elapsedMs vs parMs: speed ratio
 */
export function gradeRecall({ n, errors, completed, progress = 1, hinted = false, elapsedMs, parMs }) {
  if (!completed) return progress >= 0.5 ? 1 : 0;
  let g;
  const smallN = n <= 8;
  if (errors === 0) g = 5;
  else if (errors === 1) g = smallN ? 3 : 4;
  else if (errors <= 2) g = smallN ? 2 : 3;
  else if (errors <= 4) g = 2;
  else g = 1;
  const ratio = parMs ? elapsedMs / parMs : 0;
  if (ratio > 1.6) g -= 2; else if (ratio > 1) g -= 1;
  if (errors === 0) g = Math.max(g, 3);
  if (hinted) g = Math.min(g, 2);
  return Math.max(0, Math.min(5, g));
}

export const RHYTHM_POINTS = { perfect: 1, good: 0.8, ok: 0.5, miss: 0, wrong: 0 };
export function rhythmWindows(tokenMs) {
  return { perfect: Math.min(80, tokenMs * 0.2), good: Math.min(160, tokenMs * 0.4), ok: tokenMs * 0.5 };
}
export function judgeTap(dtMs, tokenMs) {
  const w = rhythmWindows(tokenMs), a = Math.abs(dtMs);
  return a <= w.perfect ? 'perfect' : a <= w.good ? 'good' : a <= w.ok ? 'ok' : 'miss';
}
export function gradeRhythm(judgements, hinted = false) {
  const n = judgements.length;
  if (!n) return 0;
  const avg = judgements.reduce((s, j) => s + (RHYTHM_POINTS[j] ?? 0), 0) / n;
  const bad = judgements.filter(j => j === 'wrong' || j === 'miss').length;
  let g = avg >= 0.95 && !bad ? 5 : avg >= 0.85 && bad <= 1 ? 4 : avg >= 0.7 ? 3 : avg >= 0.5 ? 2 : avg >= 0.3 ? 1 : 0;
  if (hinted) g = Math.min(g, 2);
  return g;
}
