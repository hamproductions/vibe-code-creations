// First-run onboarding: language/script → experience level → "what do you know?" checklist.
import { store, updateSettings, bulkMark } from './state.js';
import { LEVELS, LEVEL_SETTINGS, knownSlugs, nextUp } from './seed.js';
import { setLang, t } from './i18n.js';
import { esc, $, $$, mixName, toast } from './ui.js';

let O = null;
const root = () => $('#onboard');
const LV_ICON = { beginner: '🌱', regular: '🎤', veteran: '🔥', master: '👑' };

export function startOnboarding() {
  const st = store.get(), s = st.settings;
  O = { step: 1, lang: s.lang, script: s.script || 'jp', oshi: s.oshi || '', level: s.level || 'beginner', known: new Set() };
  pickLevel(O.level);
  let el = root();
  if (!el) { el = document.createElement('div'); el.id = 'onboard'; document.body.appendChild(el); }
  document.body.style.overflow = 'hidden';
  render();
}
function pickLevel(l) {
  O.level = l;
  const slugs = new Set(knownSlugs(l, store.get().mixes));
  O.known = new Set(store.get().mixes.filter(m => slugs.has(m.slug)).map(m => m.id));
}
const seg = (k, opts, cur) => `<div class="seg big">${opts.map(([v, l]) => `<button data-ob="set" data-k="${k}" data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;

function render() {
  setLang(O.lang);
  const el = root(), mixes = store.get().mixes;
  let body = '';
  if (O.step === 1) {
    body = `<h1>${t('onbWelcome')}</h1><p class="muted">${t('onbSub')}</p>
      <div class="field"><label>${t('language')}</label>${seg('lang', [['en', 'English'], ['ja', '日本語']], O.lang)}</div>
      <div class="field"><label>${t('readHow')}</label>${seg('script', [['jp', t('readJp')], ['romaji', t('readRomaji')], ['both', t('readBoth')]], O.script)}</div>
      <div class="field"><label for="ob-oshi">${t('oshi')}</label><input id="ob-oshi" class="input" value="${esc(O.oshi)}" placeholder="○○" autocomplete="off"><div class="help">${t('oshiHelp')}</div></div>`;
  } else if (O.step === 2) {
    body = `<h1>${t('onbStep2')}</h1><div class="levels">${LEVELS.map(l => `<button class="level ${O.level === l ? 'on' : ''}" data-ob="level" data-v="${l}"><span class="lv-i">${LV_ICON[l]}</span><span><b>${t('lv' + l[0].toUpperCase() + l.slice(1))}</b><br><span class="muted small">${t('lv' + l[0].toUpperCase() + l.slice(1) + 'D')}</span></span></button>`).join('')}</div>`;
  } else {
    const ls = LEVEL_SETTINGS[O.level];
    const row = m => `<label class="krow"><input type="checkbox" data-ob="known" data-id="${m.id}" ${O.known.has(m.id) ? 'checked' : ''}><span>${esc(mixName(m))}</span><span class="muted small">${t('bars', { n: m.timing })}</span></label>`;
    const tier = tr => { const items = mixes.filter(m => m.source === 'seed' && m.tier === tr); return `<div class="tier-h"><h2>${tr === 1 ? '★ ' : ''}${t('tier' + tr)}</h2><button class="chip" data-ob="tier-all" data-v="${tr}">${t('allTier')}</button><button class="chip" data-ob="tier-none" data-v="${tr}">${t('selNone')}</button></div>${items.map(row).join('')}`; };
    const next = nextUp(O.level, mixes.filter(m => m.source === 'seed'), O.known, 4);
    body = `<h1>${t('onbStep3')}</h1><p class="muted small">${t('onbKnownHelp')}</p>
      <div class="panel"><div class="small muted" style="margin-bottom:8px">${t('onbPlan')}</div><div class="tags" style="margin:0"><span class="tag pink">${t('perDay', { n: ls.newPerDay })}</span><span class="tag cy">${t(ls.mode === 'bank' ? 'tapBank' : ls.mode === 'rhythm' ? 'rhythm' : 'mixed')}</span><span class="tag">${t('speed')}: ${ls.speed === 'auto' ? t('auto') : t('off')}</span><span class="tag">${ls.bpm} BPM</span></div></div>
      <div class="panel"><div class="small muted" style="margin-bottom:6px">${t('onbNextUp')}</div>${next.map(m => `<div>▸ ${esc(mixName(m))}</div>`).join('')}</div>
      <div id="klist">${tier(1)}${tier(2)}</div>`;
  }
  el.innerHTML = `<div class="ob-wrap fadein"><div class="ob-dots">${[1, 2, 3].map(n => `<i class="${n <= O.step ? 'on' : ''}"></i>`).join('')}</div>${body}
    <div class="ob-nav">${O.step > 1 ? `<button class="btn" data-ob="back">${t('back')}</button>` : '<span></span>'}
    <span class="small muted" id="kcount">${O.step === 3 ? t('knownCount', { n: O.known.size }) : ''}</span>
    <button class="btn primary" data-ob="${O.step === 3 ? 'finish' : 'next'}">${O.step === 3 ? t('finish') : t('continue')}</button></div>
    <div style="text-align:center;margin-top:10px"><button class="chip" data-ob="skip">${t('skipSetup')}</button></div></div>`;
}

async function finish(apply = true) {
  const ids = [...O.known];
  if (apply) {
    await updateSettings({ lang: O.lang, script: O.script, oshi: O.oshi.trim(), level: O.level, onboarded: true, ...LEVEL_SETTINGS[O.level] });
    if (ids.length) await bulkMark(ids, 'known');
  } else await updateSettings({ onboarded: true });
  close();
  store.set({ tab: 'practice' });
  toast(ids.length && apply ? t('marked', { n: ids.length }) : t('finish'));
}
function close() {
  root()?.remove(); O = null; document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ob]');
  if (!b || !O) return;
  const a = b.dataset.ob, v = b.dataset.v;
  if (a === 'set') { O[b.dataset.k] = v; if (b.dataset.k === 'lang') setLang(v); const o = $('#ob-oshi'); if (o) O.oshi = o.value; render(); }
  else if (a === 'level') { pickLevel(v); render(); }
  else if (a === 'next') { const o = $('#ob-oshi'); if (o) O.oshi = o.value; O.step++; render(); root().scrollTop = 0; }
  else if (a === 'back') { O.step--; render(); }
  else if (a === 'skip') finish(false);
  else if (a === 'finish') finish(true);
  else if (a === 'tier-all' || a === 'tier-none') {
    store.get().mixes.filter(m => m.source === 'seed' && m.tier === +v).forEach(m => (a === 'tier-all' ? O.known.add(m.id) : O.known.delete(m.id)));
    const y = root().scrollTop; render(); root().scrollTop = y;
  }
});
document.addEventListener('change', e => {
  const c = e.target.closest('[data-ob="known"]');
  if (!c || !O) return;
  c.checked ? O.known.add(c.dataset.id) : O.known.delete(c.dataset.id);
  const k = $('#kcount'); if (k) k.textContent = t('knownCount', { n: O.known.size });
});
