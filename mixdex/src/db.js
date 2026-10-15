// IndexedDB persistence via Dexie, with an in-memory fallback when storage is blocked.
import Dexie from '../vendor/dexie.mjs';
import { buildSeed, SEED_VERSION } from './seed.js';
import { newProgress, STATUS_ORDER } from './srs.js';

export const DEFAULT_SETTINGS = {
  lang: (typeof navigator !== 'undefined' && /^ja/i.test(navigator.language || '')) ? 'ja' : 'en',
  script: 'romaji',
  oshi: '',
  bpm: 100,
  newPerDay: 5,
  includeExt: false,
  speed: 'off', // off | 2 | 4 | auto
  mode: 'flashcard',
  sound: false,
  haptics: true,
  latency: 0,
  onboarded: false,
  level: '',
};

let dx = null;
let mem = null; // fallback { mixes:Map, progress:Map, reviews:[], meta:Map }
export const storageMode = () => (mem ? 'memory' : 'indexeddb');

export async function openDb() {
  try {
    dx = new Dexie('mixdex');
    dx.version(1).stores({ mixes: 'id,slug,category,timing,order,source', progress: 'mixId,status,due', reviews: '++id,mixId,ts', meta: 'key' });
    await dx.open();
    await dx.meta.get('probe');
  } catch (e) {
    console.warn('IndexedDB unavailable, using memory', e);
    dx = null;
    mem = { mixes: new Map(), progress: new Map(), reviews: [], meta: new Map() };
  }
}

const api = {
  async all(table) { return dx ? dx[table].toArray() : table === 'reviews' ? mem.reviews.slice() : [...mem[table].values()]; },
  async put(table, row, key) { if (dx) await dx[table].put(row); else if (table === 'reviews') mem.reviews.push({ ...row, id: mem.reviews.length + 1 }); else mem[table].set(row[key], row); },
  async bulkPut(table, rows, key) { if (dx) await dx[table].bulkPut(rows); else rows.forEach(r => mem[table].set(r[key], r)); },
  async del(table, id) { if (dx) await dx[table].delete(id); else mem[table].delete(id); },
  async getMeta(key) { const r = dx ? await dx.meta.get(key) : mem.meta.get(key); return r?.value; },
  async setMeta(key, value) { if (dx) await dx.meta.put({ key, value }); else mem.meta.set(key, { key, value }); },
};

const SEED_ALIASES = { 'std-short': 'standard' };

export async function syncSeed() {
  const have = await api.getMeta('seedVersion');
  const seed = buildSeed();
  if (have === SEED_VERSION && (await api.all('mixes')).length >= seed.length) return seed.length;
  const existing = await api.all('mixes');
  const existingBySlug = new Map(existing.filter(m => m.source === 'seed').map(m => [m.slug, m]));
  const seedBySlug = new Map(seed.map(m => [m.slug, m]));
  const progress = new Map((await api.all('progress')).map(p => [p.mixId, p]));
  for (const [aliasSlug, canonicalSlug] of Object.entries(SEED_ALIASES)) {
    const alias = existingBySlug.get(aliasSlug), canonical = seedBySlug.get(canonicalSlug);
    const choices = [alias && progress.get(alias.id), canonical && progress.get(canonical.id)].filter(Boolean);
    if (!alias || !canonical || !choices.length) continue;
    choices.sort((a, b) => (b.lastReviewed || 0) - (a.lastReviewed || 0) || STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status));
    const bestTimes = choices.map(p => p.bestMs).filter(ms => ms != null);
    await api.put('progress', {
      ...choices[0], mixId: canonical.id,
      reviews: choices.reduce((n, p) => n + (p.reviews || 0), 0),
      lapses: choices.reduce((n, p) => n + (p.lapses || 0), 0),
      lastReviewed: Math.max(...choices.map(p => p.lastReviewed || 0)),
      bestMs: bestTimes.length ? Math.min(...bestTimes) : null,
    }, 'mixId');
  }
  const ids = new Set(seed.map(s => s.id));
  for (const m of existing) if (m.source === 'seed' && !ids.has(m.id)) { await api.del('mixes', m.id); await api.del('progress', m.id); }
  await api.bulkPut('mixes', seed, 'id');
  const prog = new Map((await api.all('progress')).map(p => [p.mixId, p]));
  const missing = seed.filter(s => !prog.has(s.id)).map(s => newProgress(s.id));
  if (missing.length) await api.bulkPut('progress', missing, 'mixId');
  await api.setMeta('seedVersion', SEED_VERSION);
  return seed.length;
}

export async function loadAll() {
  const [mixes, progress] = await Promise.all([api.all('mixes'), api.all('progress')]);
  mixes.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.name.localeCompare(b.name));
  return { mixes, progress: new Map(progress.map(p => [p.mixId, p])) };
}
export const loadSettings = async () => ({ ...DEFAULT_SETTINGS, ...((await api.getMeta('settings')) || {}) });
export const saveSettings = s => api.setMeta('settings', s);
export const saveProgress = p => api.put('progress', p, 'mixId');
export const saveProgressBulk = rows => api.bulkPut('progress', rows, 'mixId');
export async function saveMixes(rows) {
  await api.bulkPut('mixes', rows.map(r => ({ ...r })), 'id');
  const have = new Set((await api.all('progress')).map(p => p.mixId));
  const missing = rows.filter(r => !have.has(r.id)).map(r => newProgress(r.id));
  if (missing.length) await api.bulkPut('progress', missing, 'mixId');
}
export const logReview = r => api.put('reviews', r, 'id');
export const loadReviews = () => api.all('reviews');
export const getMeta = api.getMeta, setMeta = api.setMeta;

export async function saveMix(mix) {
  await api.put('mixes', mix, 'id');
  if (!(await api.all('progress')).some(p => p.mixId === mix.id)) await api.put('progress', newProgress(mix.id), 'mixId');
}
export async function deleteMix(id) { await api.del('mixes', id); await api.del('progress', id); }

export async function exportAll() {
  return { app: 'mixdex', version: 1, exportedAt: new Date().toISOString(), settings: await loadSettings(), custom: (await api.all('mixes')).filter(m => m.source === 'custom'), progress: await api.all('progress'), reviews: await api.all('reviews') };
}
export async function importAll(data) {
  const invalid = () => { throw new Error('Invalid MIXDEX backup'); };
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  const strings = v => Array.isArray(v) && v.every(x => typeof x === 'string');
  const layout = (v, n) => Array.isArray(v) && v.every(x => Number.isInteger(x) && x >= 0) && v.reduce((a, b) => a + b, 0) === n;
  if (!object(data) || data.app !== 'mixdex' || data.version !== 1) invalid();
  for (const key of ['custom', 'progress', 'reviews']) if (!Array.isArray(data[key])) invalid();
  if (!object(data.settings)) invalid();
  const seedIds = new Set(buildSeed().map(m => m.id));
  const customIds = new Set();
  for (const m of data.custom) {
    if (m?.chantBody != null && typeof m.chantBody !== 'string') invalid();
    if (!object(m) || typeof m.id !== 'string' || !m.id || seedIds.has(m.id) || customIds.has(m.id) || m.source !== 'custom' || typeof m.slug !== 'string' || typeof m.name !== 'string' || !m.name.trim() || typeof m.jp !== 'string' || !['Basic', 'Language Variant', 'Advanced', 'Koujou', 'Theme'].includes(m.category) || !Number.isFinite(m.timing) || m.timing < 1 || m.timing > 64 || !strings(m.sequence) || !m.sequence.length || !strings(m.reading) || m.reading.length !== m.sequence.length || !layout(m.layout, m.sequence.length) || !strings(m.extension) || !strings(m.extReading) || m.extReading.length !== m.extension.length || !layout(m.extLayout, m.extension.length) || !strings(m.notes) || typeof m.trigger_context !== 'string') invalid();
    customIds.add(m.id);
  }
  const knownIds = new Set([...seedIds, ...(await api.all('mixes')).map(m => m.id), ...customIds]);
  const progressIds = new Set();
  for (const p of data.progress) {
    if (!object(p) || !knownIds.has(p.mixId) || progressIds.has(p.mixId) || !STATUS_ORDER.includes(p.status)) invalid();
    for (const key of ['interval', 'easeFactor', 'streak', 'due', 'lastReviewed', 'reviews', 'lapses']) if (!Number.isFinite(p[key]) || p[key] < 0) invalid();
    if (p.lastGrade != null && (!Number.isInteger(p.lastGrade) || p.lastGrade < 0 || p.lastGrade > 5)) invalid();
    if (p.bestMs != null && (!Number.isFinite(p.bestMs) || p.bestMs < 0)) invalid();
    progressIds.add(p.mixId);
  }
  for (const r of data.reviews) if (!object(r) || !knownIds.has(r.mixId) || !Number.isFinite(r.ts) || r.ts < 0 || !Number.isInteger(r.grade) || r.grade < 0 || r.grade > 5) invalid();
  const settings = { ...await loadSettings() };
  for (const [key, value] of Object.entries(data.settings)) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    if (typeof value !== typeof DEFAULT_SETTINGS[key] || typeof value === 'number' && !Number.isFinite(value)) invalid();
    settings[key] = value;
  }
  if (!['en', 'ja'].includes(settings.lang) || !['jp', 'romaji', 'both'].includes(settings.script) || !Number.isInteger(settings.newPerDay) || settings.newPerDay < 0 || settings.newPerDay > 20) invalid();
  const reviewKey = r => JSON.stringify([r.mixId, r.ts, r.grade, r.mode ?? '', r.ms ?? null]);
  const seen = new Set((await api.all('reviews')).map(reviewKey));
  const reviews = data.reviews.filter(r => { const key = reviewKey(r); if (seen.has(key)) return false; seen.add(key); return true; });
  const apply = async () => {
    await saveMixes(data.custom);
    await api.bulkPut('progress', data.progress, 'mixId');
    await saveSettings(settings);
    for (const r of reviews) { const { id, ...rest } = r; await api.put('reviews', rest, 'id'); }
  };
  if (dx) await dx.transaction('rw', dx.mixes, dx.progress, dx.reviews, dx.meta, apply);
  else await apply();
}
export async function resetAll() {
  if (dx) { await dx.delete(); dx = null; }
  mem = null;
}

export async function savePracticeResults(progress, reviews) {
  const apply = async () => {
    if (progress.length) await api.bulkPut('progress', progress, 'mixId');
    for (const review of reviews) await api.put('reviews', review, 'id');
  };
  if (dx) await dx.transaction('rw', dx.progress, dx.reviews, apply);
  else await apply();
}
