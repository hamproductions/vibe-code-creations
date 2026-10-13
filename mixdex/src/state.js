import { createStore } from './store.js';
import { DEFAULT_SETTINGS } from './db.js';
import { buildVocab, siblingTokens } from './interference.js';

export const store = createStore({
  ready: false, mixes: [], progress: new Map(), settings: { ...DEFAULT_SETTINGS },
  tab: 'codex', q: '', fCat: 'all', fStatus: 'all', fTier: 'all', sort: 'learn', session: false,
});

let vocabCache = null, vocabFor = null;
export function getVocab() {
  const { mixes } = store.get();
  if (vocabFor !== mixes) { vocabCache = buildVocab(mixes); vocabFor = mixes; sibCache.clear(); }
  return vocabCache;
}
const sibCache = new Map();
export function getSiblings(mix) {
  getVocab();
  if (!sibCache.has(mix.id)) sibCache.set(mix.id, siblingTokens(mix, store.get().mixes));
  return sibCache.get(mix.id);
}

import { saveSettings, saveProgressBulk } from './db.js';
import { newProgress } from './srs.js';
import { setLang } from './i18n.js';
export async function updateSettings(patch) {
  const settings = { ...store.get().settings, ...patch };
  store.set({ settings });
  if (patch.lang) setLang(patch.lang);
  try { await saveSettings(settings); } catch (e) { console.warn(e); }
}

/** bulk progress edit: kind = new | learning | known | mastered (no locking anywhere — user decides) */
export async function bulkMark(ids, kind) {
  const now = Date.now(), DAY = 86400000;
  const progress = new Map(store.get().progress);
  const rows = [];
  [...ids].forEach((id, i) => {
    const prev = progress.get(id) || newProgress(id);
    let p;
    if (kind === 'new') p = newProgress(id);
    else if (kind === 'learning') p = { ...prev, status: 'LEARNING', interval: 0, streak: 0, due: now };
    else if (kind === 'known') p = { ...prev, status: 'REMEMBERED', interval: 3, streak: Math.max(2, prev.streak), due: now + (i % 4) * DAY };
    else p = { ...prev, status: 'MASTERED', interval: 30, streak: Math.max(5, prev.streak), due: now + 30 * DAY };
    progress.set(id, p); rows.push(p);
  });
  await saveProgressBulk(rows);
  store.set({ progress });
  return rows.length;
}
