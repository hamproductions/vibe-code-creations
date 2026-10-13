// IndexedDB persistence via Dexie, with an in-memory fallback when storage is blocked.
import Dexie from '../vendor/dexie.mjs';
import { buildSeed, SEED_VERSION } from './seed.js';
import { newProgress } from './srs.js';

export const DEFAULT_SETTINGS = {
  lang: (typeof navigator !== 'undefined' && /^ja/i.test(navigator.language || '')) ? 'ja' : 'en',
  script: 'jp', // jp | romaji | both
  oshi: '',
  bpm: 100,
  newPerDay: 5,
  includeExt: false,
  speed: 'off', // off | 2 | 4 | auto
  mode: 'mixed', // bank | rhythm | mixed
  sound: true,
  haptics: true,
  latency: 0,
  revealLocked: true,
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

export async function syncSeed() {
  const have = await api.getMeta('seedVersion');
  const seed = buildSeed();
  if (have === SEED_VERSION && (await api.all('mixes')).length >= seed.length) return seed.length;
  const existing = await api.all('mixes');
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
  if (data?.app !== 'mixdex') throw new Error('Not a MIXDEX backup');
  if (data.custom?.length) await api.bulkPut('mixes', data.custom, 'id');
  if (data.progress?.length) await api.bulkPut('progress', data.progress, 'mixId');
  if (data.settings) await saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
  if (data.reviews?.length) for (const r of data.reviews) { const { id, ...rest } = r; await api.put('reviews', rest, 'id'); }
}
export async function resetAll() {
  if (dx) { await dx.delete(); dx = null; }
  mem = null;
}
