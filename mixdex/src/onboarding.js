import { store, updateSettings } from './state.js';
import { setLang, t } from './i18n.js';
import { esc, $, tokHtml, rowsOf, mixName } from './ui.js';

let O = null, previousFocus = null;
const root = () => $('#onboard');

export function startOnboarding() {
  const s = store.get().settings;
  O = { lang: s.lang, script: s.script, returnTab: store.get().tab, saving: false };
  previousFocus = document.activeElement;
  let el = root();
  if (!el) { el = document.createElement('div'); el.id = 'onboard'; document.body.appendChild(el); }
  $('#app').inert = true;
  $('#sheetRoot').inert = true;
  document.body.style.overflow = 'hidden';
  render();
}

function render() {
  setLang(O.lang);
  const m = store.get().mixes.find(m => m.slug === 'standard');
  const settings = { ...store.get().settings, script: O.script };
  root().innerHTML = `<div class="ob-wrap" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <div class="sheet-h"><h1 id="guide-title">${t('guideTitle')}</h1><button class="x" data-ob="close" aria-label="${t('close')}">×</button></div>
    <p class="guide-intro">${t('guideIntro')}</p>
    <div class="guide-example"><h2>${esc(mixName(m))}</h2><p class="small muted">${t('guideExample')}</p>
      ${rowsOf(m.sequence.length, m.layout).map(st => `<div class="stanza">${st.map(r => `<div class="line">${r.map(i => tokHtml(m.sequence[i], m.reading[i], settings)).join('')}</div>`).join('')}</div>`).join('')}
    </div>
    <div class="guide-facts"><p class="muted">${t('guideWhen')}</p><p class="muted">${t('guideMethod')}</p></div>
    <div class="guide-settings"><label>${t('language')}<select class="input" data-ob-setting="lang"><option value="en" ${O.lang === 'en' ? 'selected' : ''}>English</option><option value="ja" ${O.lang === 'ja' ? 'selected' : ''}>日本語</option></select></label></div>
    <div class="guide-choices"><button class="btn" data-ob="browse">${t('browseLibrary')}</button><button class="btn" data-ob="learn">${t('openLearningPath')}</button></div></div>`;
  $('.ob-wrap .x', root()).focus({ preventScroll: true });
}

async function finish(destination = 'close') {
  if (!O || O.saving) return;
  O.saving = true;
  const tab = destination === 'browse' ? 'codex' : destination === 'learn' ? 'practice' : O.returnTab;
  await updateSettings({ lang: O.lang, script: O.script, onboarded: true, mode: 'flashcard' });
  root()?.remove(); O = null;
  $('#app').inert = false;
  $('#sheetRoot').inert = false;
  document.body.style.overflow = '';
  previousFocus?.focus();
  store.set({ tab });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ob]');
  if (b && O) finish(b.dataset.ob);
});
document.addEventListener('change', e => {
  if (!O || !e.target.dataset.obSetting) return;
  O[e.target.dataset.obSetting] = e.target.value;
  const key = e.target.dataset.obSetting;
  render();
  $(`[data-ob-setting="${key}"]`, root()).focus();
});
document.addEventListener('keydown', e => {
  if (!O) return;
  if (e.key === 'Escape') { e.preventDefault(); finish(); }
  if (e.key === 'Tab') {
    const items = [...root().querySelectorAll('button, select')], first = items[0], last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
