import { toRomaji as wkRomaji } from '../vendor/wanakana.mjs';
import { toRomaji } from './romaji.js';
import { t, getLang, trTrigger } from './i18n.js';
import { getVocab } from './state.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const cap = s => s.replace(/(^|[\s-])([a-z])/g, (_, a, b) => a + b.toUpperCase());
const HUE = { Basic: 330, 'Language Variant': 190, Advanced: 270, Koujou: 350, Theme: 40 };
export const hueFor = c => HUE[c] ?? 210;

export const ICON = {
  codex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
};

/** Replace ○○ with the user's oshi name */
export function oshiSub(s, settings) {
  if (!settings?.oshi || !s.includes('○')) return s;
  return s.replace(/○○/g, settings.oshi).replace(/\[Name\]/g, settings.oshi);
}
const roOf = (token, ro) => (ro ?? getVocab().get(token)?.ro ?? toRomaji(token));
const roShow = (token, ro, settings) => {
  if (token === '👏') return '(clap)';
  let r = roOf(token, ro);
  if (settings?.oshi && token.includes('○')) {
    const nm = /[a-zA-Z]/.test(settings.oshi) ? settings.oshi : wkRomaji(settings.oshi);
    r = r.replace(/○○/g, nm).replace(/\[Name\]/g, nm);
  }
  return cap(r);
};
export function tokText(token, ro, settings) {
  const jp = oshiSub(token, settings);
  const rom = roShow(token, ro, settings);
  const mode = settings.script;
  if (token === '👏') return { a: '👏', b: '' };
  if (mode === 'romaji') return { a: rom, b: '' };
  if (mode === 'both') return { a: jp, b: rom };
  return { a: jp, b: '' };
}
export const tokHtml = (token, ro, settings, cls = 'tok', extra = '') => {
  const { a, b } = tokText(token, ro, settings);
  return `<span class="${cls}" ${extra}><span class="a">${esc(a)}</span>${b ? `<span class="b">${esc(b)}</span>` : ''}</span>`;
};

/** group tokens into stanza rows from a layout array (0 = stanza break) */
export function rowsOf(n, layout) {
  const sum = (layout || []).reduce((a, b) => a + b, 0);
  const lay = sum === n && layout?.length ? layout : Array.from({ length: Math.ceil(n / 4) }, (_, i) => Math.min(4, n - i * 4));
  const stanzas = [[]];
  let idx = 0;
  for (const c of lay) {
    if (c === 0) { if (stanzas[stanzas.length - 1].length) stanzas.push([]); continue; }
    stanzas[stanzas.length - 1].push(Array.from({ length: c }, () => idx++));
  }
  return stanzas.filter(s => s.length);
}

export const mixName = (m, lang = getLang()) => (lang === 'ja' && m.jp ? m.jp : m.name);
export const mixSub = (m, lang = getLang()) => (lang === 'ja' ? m.name : m.jp);
export const trig = m => trTrigger(m.trigger_context, getLang());

// ---- sheet
let sheetCloseCb = null;
export function openSheet(html, { onClose } = {}) {
  const root = $('#sheetRoot');
  root.innerHTML = `<div class="scrim" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  sheetCloseCb = onClose || null;
  requestAnimationFrame(() => root.classList.add('open'));
  document.body.style.overflow = 'hidden';
  return $('.sheet', root);
}
export function closeSheet() {
  const root = $('#sheetRoot');
  root.classList.remove('open');
  document.body.style.overflow = '';
  const cb = sheetCloseCb; sheetCloseCb = null;
  setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 260);
  cb && cb();
}
export const sheetOpen = () => $('#sheetRoot').classList.contains('open');

let toastTimer;
export function toast(msg, ms = 2200) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export const fmtMs = ms => (ms / 1000).toFixed(1) + 's';
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
