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

import { saveSettings } from './db.js';
import { setLang } from './i18n.js';
export async function updateSettings(patch) {
  const settings = { ...store.get().settings, ...patch };
  store.set({ settings });
  if (patch.lang) setLang(patch.lang);
  try { await saveSettings(settings); } catch (e) { console.warn(e); }
}
