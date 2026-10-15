import { QrCode } from '../vendor/qrcodegen.mjs';
import { openDb, saveMixes, syncSeed, loadAll, loadSettings, loadReviews, saveMix, deleteMix, exportAll, importAll, resetAll, storageMode } from './db.js';
import { store, updateSettings, bulkMark, rememberSavedLang } from './state.js';
import { STATUS, STATUS_ORDER } from './srs.js';
import { countQueue } from './engine.js';
import { parseBody } from './parse.js';
import { toRomaji } from './romaji.js';
import { uuidFrom, entryToMix, mixToText, buildSeed } from './seed.js';
import { parseSeedFile } from './parse.js';
import { startOnboarding } from './onboarding.js';
import { setLang, t, getLang, trCatalog } from './i18n.js';
import { kanaKey, searchQuery, tightKey, esc, $, $$, ICON, hueFor, tokHtml, rowsOf, mixName, mixSub, trig, openSheet, closeSheet, sheetOpen, toast, pct, learningNotes, statusBadge, catalogFilters } from './ui.js';
import { renderSetup, endSession, sessionActive, practiceAction, refreshSession, selectForPractice } from './practice.js';
import { bind, unbind } from '../vendor/wanakana.mjs';

const view = () => $('#view');
const F = { q: '', cat: 'all', status: 'all', tier: 'all', sort: 'learn', group: 'families' };
const CATS = ['Basic', 'Language Variant', 'Advanced', 'Koujou', 'Theme'];
const hayCache = new WeakMap();
let selMode = false, visibleIds = [];
const sel = new Set();

// ------------------------------------------------------------------ boot
async function boot() {
  try {
    await openDb();
    await syncSeed();
    const settings = await loadSettings();
    const linkLang = new URLSearchParams(location.hash.includes('?') ? location.hash.split('?')[1] : location.hash.slice(1)).get('lang');
    rememberSavedLang(settings.lang);
    if (['en', 'ja'].includes(linkLang)) settings.lang = linkLang;
    const { mixes, progress } = await loadAll();
    setLang(settings.lang);
    store.set({ settings, mixes, progress, ready: true });
  } catch (e) {
    console.error(e);
    view().innerHTML = `<div class="empty">${t('startFailed')}</div>`;
    return;
  }
  if (storageMode() === 'memory') { const w = $('#storageWarn'); w.hidden = false; w.textContent = t('storageMem'); }
  store.subscribe(() => schedule());
  const first = parseRoute();
  if (first.tab !== store.get().tab) store.set({ tab: first.tab });
  render();
  if (first.mix) openMix(first.mix, false);
  if (first.missing) { history.replaceState(null, '', routeOf('codex')); toast(t('linkMissing')); }
  if (!first.mix && !store.get().settings.onboarded) startOnboarding();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ------------------------------------------------------------------ routing (#/codex, #/practice, #/stats, #/settings, #/mix/<slug|id>)
const TABS = ['home', 'codex', 'practice', 'stats', 'settings'];
let detailId = null, detailPushed = false;
const findMix = key => store.get().mixes.find(m => m.slug === key || m.id === key);
function parseRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get('mix')) return findMix(params.get('mix')) ? { tab: 'codex', mix: findMix(params.get('mix')).id } : { tab: 'codex', mix: null, missing: true };
  const [a, b] = decodeURIComponent(location.hash.replace(/^#\/?/, '').split('?')[0]).split('/');
  if (a === 'mix' && b) return findMix(b) ? { tab: 'codex', mix: findMix(b).id } : { tab: 'codex', mix: null, missing: true };
  return { tab: TABS.includes(a) ? a : 'home', mix: null };
}
const routeOf = tab => '#/' + tab;
function openMix(id, push = true) {
  const m = findMix(id);
  if (!m) return;
  if (push && !detailId) { history.pushState(null, '', '#/mix/' + encodeURIComponent(m.slug)); detailPushed = true; }
  else if (!push) { history.replaceState(null, '', '#/mix/' + encodeURIComponent(m.slug)); detailPushed = false; }
  detailId = m.id;
  openDetail(m.id);
}
// leave the mix route without closing the sheet again (used when another action takes over)
function leaveMixRoute(hash) { if (detailId) { history.replaceState(null, '', hash); detailId = null; } }
function onDetailClosed() {
  if (!detailId) return;
  detailId = null;
  if (detailPushed) history.back(); else history.replaceState(null, '', routeOf(store.get().tab));
}
window.addEventListener('hashchange', () => {
  if (!store.get().ready) return;
  const r = parseRoute(), linkLang = new URLSearchParams(location.hash.slice(1)).get('lang');
  if (['en', 'ja'].includes(linkLang) && linkLang !== getLang()) { setLang(linkLang); store.set({ settings: { ...store.get().settings, lang: linkLang } }); if (r.mix) detailId = null; }
  if (!r.mix && detailId) { detailId = null; closeSheet(); }
  if (r.tab !== store.get().tab) { if (sessionActive()) endSession(); store.set({ tab: r.tab }); lastTab = null; render(); }
  if (r.mix && r.mix !== detailId) { detailId = null; openMix(r.mix, false); }
  if (r.missing) { history.replaceState(null, '', routeOf('codex')); toast(t('linkMissing')); }
});

let renderPending = false;
const schedule = () => {
  if (renderPending) return;
  renderPending = true;
  queueMicrotask(() => { renderPending = false; render(); });
};

// ------------------------------------------------------------------ shell
function renderTabbar() {
  const st = store.get();
  const c = countQueue(st.mixes, st.progress, { newLimit: 0 });
  const tabs = [['home', ICON.home], ['codex', ICON.codex], ['practice', ICON.practice], ['stats', ICON.stats], ['settings', ICON.settings]];
  $('#tabbar').setAttribute('aria-label', t('mainNavigation'));
  $('.lang').setAttribute('aria-label', t('language'));
  document.title = 'MIXDEX | ' + (st.tab === 'home' ? t('homeEyebrow') : t(st.tab));
  const focused = document.activeElement?.closest?.('#tabbar') ? document.activeElement.dataset.v : null;
  $('#tabbar').innerHTML = tabs.map(([k, ic]) => `<button data-act="tab" data-v="${k}" class="${st.tab === k ? 'on' : ''}" aria-current="${st.tab === k}">${ic}<span class="nav-label">${t(k)}${k === 'practice' && c.due ? `<span class="badge">${c.due}</span>` : ''}</span></button>`).join('');
  if (focused) $(`#tabbar [data-v="${focused}"]`).focus();
  $$('.lang button').forEach(b => { b.classList.toggle('on', b.dataset.v === getLang()); b.setAttribute('aria-pressed', b.dataset.v === getLang()); });
}

let lastTab = null, lastLang = null;
function render() {
  const st = store.get();
  if (!st.ready) return;
  setLang(st.settings.lang);
  renderTabbar();
  if (st.tab === 'practice' && st.session) { if (lastLang !== getLang()) { lastLang = getLang(); refreshSession(); } return; }
  const changed = lastTab !== st.tab || lastLang !== getLang();
  lastTab = st.tab; lastLang = getLang();
  if (st.tab === 'home') renderHome();
  else if (st.tab === 'codex') { if (changed || !$('#grid')) renderCodex(); else renderGrid(); }
  else if (st.tab === 'practice') renderSetup();
  else if (st.tab === 'stats') renderStats();
  else if (changed || !$('#oshi')) renderSettings();
  if (changed) window.scrollTo(0, 0);
  if (!detailId && parseRoute().tab !== st.tab) history.replaceState(null, '', routeOf(st.tab));
}

function renderHome() {
  const st = store.get();
  const total = st.mixes.length;
  view().innerHTML = `<div class="home fadein">
    <section class="home-intro">
      <div><p class="eyebrow">${t('homeEyebrow')}</p><h1>${t('homeTitle')}</h1><p class="muted">${t('homeIntro')}</p></div>
      <button class="chip" data-act="onboard">${t('mixGuide')}</button>
    </section>
    <div class="home-paths">
      <article class="home-path home-library">
        <div class="home-path-label"><span>01</span><span>${t('homeLibraryLabel')}</span></div>
        <h2>${t('homeBrowse')}</h2><p>${t('homeBrowseText')}</p>
        <div class="home-path-meta">${t('homeEntryCount', { n: total })}</div>
        <button class="btn primary block" data-act="tab" data-v="codex">${t('homeBrowseCta')}</button>
      </article>
      <article class="home-path home-learning">
        <div class="home-path-label"><span>02</span><span>${t('homeLearningLabel')}</span></div>
        <h2>${t('homeLearn')}</h2><p>${t('homeLearnText')}</p>
        <div class="home-path-meta">${t('homeLearningMethod')}</div>
        <button class="btn primary block" data-act="tab" data-v="practice">${t('homeLearnCta')}</button>
      </article>
    </div>
    <p class="home-shared">${t('homeShared')}</p>
  </div>`;
}

// ------------------------------------------------------------------ codex
const hay = m => {
  let h = hayCache.get(m);
  if (!h) {
    const jp = [m.jp, m.trigger_context, ...m.sequence, ...(m.extension || [])].join(' ');
    h = { latin: [m.name, ...(m.aliases || []), m.category, m.trigger_context, ...m.reading, ...(m.extReading || [])].join(' ').toLowerCase(), kana: kanaKey([jp, ...(m.aliases || []), ...m.reading, ...(m.extReading || [])].join(' ')) };
    h.tight = tightKey(h.latin) + ' ' + tightKey(h.kana);
    hayCache.set(m, h);
  }
  return h;
};
function matches(m, p) {
  if (F.cat !== 'all' && m.category !== F.cat) return false;
  if (F.status !== 'all' && p.status !== F.status) return false;
  if (F.tier !== 'all' && m.tier !== +F.tier) return false;
  const q = searchQuery(F.q);
  if (!q) return true;
  const h = hay(m);
  if (h.latin.includes(q)) return true;
  const tight = tightKey(q);
  return h.kana.includes(kanaKey(q)) || h.tight.includes(tight) || h.tight.includes(kanaKey(tight));
}
function sorted(list, progress) {
  const a = list.slice();
  if (F.sort === 'name') a.sort((x, y) => x.name.localeCompare(y.name));
  else if (F.sort === 'due') a.sort((x, y) => { const px = progress.get(x.id), py = progress.get(y.id); const dx = px.status === STATUS.NOT_LEARNED ? 9e15 : px.due, dy = py.status === STATUS.NOT_LEARNED ? 9e15 : py.due; return dx - dy; });
  else if (F.sort === 'status') a.sort((x, y) => STATUS_ORDER.indexOf(progress.get(y.id).status) - STATUS_ORDER.indexOf(progress.get(x.id).status));
  return a;
}

function renderCodex() {
  view().innerHTML = `<div class="fadein">
    <div class="page-heading library-heading"><div><h1>${t('codex')}</h1><p class="muted">${t('libraryIntro')}</p></div><div class="heading-actions"><button class="btn" data-act="tab" data-v="practice">${t('practice')}</button><button class="chip" data-act="onboard">${t('mixGuide')}</button></div></div>
    <div class="toolbar"><input id="q" class="input" type="search" placeholder="${esc(t('search'))}" value="${esc(F.q)}" autocomplete="off" autocapitalize="off" aria-label="${esc(t('search'))}">
      <select id="sort" class="input" aria-label="${t('sort')}">${[['learn', 'sortLearn'], ['name', 'sortName'], ['due', 'sortDue'], ['status', 'sortStatus']].map(([v, k]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>
      <button class="chip ${selMode ? 'on' : ''}" data-act="sel-toggle" aria-pressed="${selMode}" style="min-height:44px">${selMode ? '✓ ' : ''}${t('select')}</button>
    </div>
    <div id="chips"></div><div class="catalog-view">${catalogFilters('browse', F)}<label>${t('browseView')}<select class="input" id="browse-group">${[['families', 'mixFamilies'], ['versions', 'allVersions']].map(([v, key]) => `<option value="${v}" ${F.group === v ? 'selected' : ''}>${t(key)}</option>`).join('')}</select></label><button class="chip" data-act="browse-reset">${t('clearFilters')}</button></div>
    ${selMode ? `<p class="small muted">${t('selectionHelp')}</p>` : ''}<div id="dexline"></div><div id="grid"></div><div id="selbar"></div></div>`;
  renderGrid();
}

function chipRow(items, cur, act) {
  return `<div class="chips status-filter">${items.map(([v, l]) => `<button class="chip ${String(cur) === String(v) ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
}

function renderGrid() {
  const st = store.get(), { mixes, progress, settings } = st;
  $('#chips').innerHTML = chipRow([['all', t('all')], ...STATUS_ORDER.map(s => [s, t(s)])], F.status, 'f-status');
  const n = { l: 0, r: 0, m: 0 };
  const learningIds = new Set(mixes.filter(m => !m.excerptOf && !m.sourcePending).map(m => m.id));
  progress.forEach(p => { if (!learningIds.has(p.mixId)) return; if (p.status === STATUS.LEARNING) n.l++; else if (p.status === STATUS.REMEMBERED) n.r++; else if (p.status === STATUS.MASTERED) n.m++; });
  const tot = learningIds.size;
  $('#dexline').innerHTML = `<div class="dexline"><span>${t('startedCount', { n: `<b>${n.l + n.r + n.m}</b>`, total: tot })}</span><div class="meter" aria-hidden="true"><i class="m-mas" style="width:${pct(n.m, tot)}%"></i><i class="m-rem" style="width:${pct(n.r, tot)}%"></i><i class="m-learn" style="width:${pct(n.l, tot)}%"></i></div><span>✨ ${n.m}</span></div>`;
  const list = sorted(mixes.filter(m => matches(m, progress.get(m.id))), progress);
  visibleIds = list.filter(m => !m.excerptOf && !m.sourcePending).map(m => m.id);
  renderSelBar();
  const no = new Map(mixes.map((m, i) => [m.id, i + 1]));
  const card = m => cardHtml(m, progress.get(m.id), no.get(m.id), settings);
  const familyView = F.group === 'families' && !F.q.trim() && !selMode;
  const families = new Map();
  list.forEach(m => { const key = m.family || m.slug; if (!families.has(key)) families.set(key, []); families.get(key).push(m); });
  const familyCard = items => `<section class="family-card">${card(items[0])}${items.length > 1 ? `<details><summary>${t((items.slice(1).every(m => m.excerptOf) ? 'excerptCount' : 'variantCount') + (items.length === 2 ? 'One' : ''), { n: items.length - 1 })}</summary><div class="family-versions">${items.slice(1).map(m => `<button data-act="open" data-id="${m.id}"><span>${esc(mixName(m))}</span><span class="small muted">${m.excerptOf ? t('excerpt') : t(progress.get(m.id).status)}</span></button>`).join('')}</div></details>` : ''}</section>`;
  const displayed = familyView ? [...families.values()].map(items => items[0]) : list;
  const displayCard = m => familyView ? familyCard(families.get(m.family || m.slug)) : card(m);
  const grouped = F.sort === 'learn' && F.tier === 'all';
  if (!list.length) $('#grid').innerHTML = `<div class="empty"><p>${t('empty')}</p><div class="btns"><button class="btn" data-act="browse-reset">${t('clearFilters')}</button></div></div>`;
  else if (grouped) {
    $('#grid').innerHTML = [1, 2, 3].map(tr => {
      const items = displayed.filter(m => m.tier === tr);
      if (!items.length) return '';
      const learnable = items.filter(m => !m.excerptOf && !m.sourcePending), done = learnable.filter(m => progress.get(m.id).status !== STATUS.NOT_LEARNED).length;
      return `<div class="tier-h"><h2>${tr === 1 ? '★ ' : ''}${t('tier' + tr)}</h2><span>${t('tier' + tr + 'd')}</span><span class="tcount">${done}/${learnable.length}</span></div><div class="grid">${items.map(displayCard).join('')}</div>`;
    }).join('');
  } else $('#grid').innerHTML = `<div class="grid">${displayed.map(displayCard).join('')}</div>`;
}

function cardHtml(m, p, no, settings) {
  return `<button class="card ${m.excerptOf ? '' : 'st-' + p.status} ${selMode && sel.has(m.id) ? 'sel' : ''}" style="--hue:${hueFor(m.category)}" data-act="open" data-id="${m.id}" aria-label="${esc(mixName(m))}, ${t(m.excerptOf ? 'excerpt' : p.status)}" ${selMode ? `aria-pressed="${sel.has(m.id)}"` : ''} ${selMode && (m.excerptOf || m.sourcePending) ? 'disabled' : ''}>
    ${selMode && !m.excerptOf && !m.sourcePending ? `<span class="chk" aria-hidden="true">${sel.has(m.id) ? '✓' : ''}</span>` : ''}
    <span class="no"><span>#${String(no).padStart(3, '0')}</span><span>${t(m.category)}</span></span>
    ${statusBadge(m.excerptOf ? 'excerpt' : p.status)}<span class="name">${esc(mixName(m))}</span><span class="jp">${esc(mixSub(m))}</span>
    <span class="chant-preview">${m.sequence.slice(0, m.tokenization === 'phrases' ? 1 : 4).map((token, i) => tokHtml(token, m.reading[i], settings, 'pv')).join(' ')}</span>
    <span class="meta"><span>${m.timing ? t('bars', { n: m.timing }) : m.timingOptions?.length ? t('timingVaries') : t('timingUnknown')}</span></span></button>`;
}

// ------------------------------------------------------------------ detail
function openDetail(id) {
  const st = store.get(), m = st.mixes.find(x => x.id === id);
  if (!m) return;
  const link = new URL(location.href); link.hash = new URLSearchParams({ mix: m.slug, lang: getLang() }).toString();
  history.replaceState(null, '', link);
  const p = st.progress.get(id), s = st.settings, fresh = p.status === STATUS.NOT_LEARNED;
  const body = (toks, ros, layout, cls) => rowsOf(toks.length, layout).map(stz => `<div class="stanza">${stz.map(r => `<div class="line">${r.map(i => tokHtml(toks[i], ros[i], s, cls)).join('')}</div>`).join('')}</div>`).join('');
  const due = fresh ? '—' : p.due <= Date.now() ? t('dueNow') : new Date(p.due).toLocaleDateString(getLang());
  const variants = st.mixes.filter(x => x.id !== id && x.family && x.family === m.family);
  const parent = m.excerptOf ? st.mixes.find(x => x.slug === m.excerptOf) : null;
  const tags = `<div class="tags"><span class="tag t1">${t('tier' + m.tier)}</span><span class="tag pink">${t(m.category)}</span>${m.timing ? `<span class="tag">${t('bars', { n: m.timing })}</span>` : ''}${m.source === 'custom' ? `<span class="tag">${t('custom')}</span>` : ''}</div>`;
  const context = m.trigger_context || m.initiator || m.initiatorJp ? `<dl class="kv">${m.trigger_context ? `<dt>${t('trigger')}</dt><dd>${esc(trig(m))}</dd>` : ''}${m.initiator || m.initiatorJp ? `<dt>${t('initiator')}</dt><dd>${tokHtml(m.initiatorJp || m.initiator, m.initiator, s, 'pv')}</dd>` : ''}</dl>` : '';
  const progress = parent ? `<section class="detail-block"><p class="small muted">${t('excerptHelp')}</p><button class="btn block" data-act="open" data-id="${parent.id}">${t('viewCompleteMix')}</button></section>` : `<section class="detail-block"><h3>${t('yourProgress')}</h3><div class="status-controls">${[['new', STATUS.NOT_LEARNED], ['learning', STATUS.LEARNING], ['known', STATUS.REMEMBERED], ['mastered', STATUS.MASTERED]].map(([kind, status]) => `<button class="chip ${p.status === status ? 'on' : ''}" data-act="d-mark" data-id="${id}" data-v="${kind}" aria-pressed="${p.status === status}">${t(status)}</button>`).join('')}</div><p class="small muted">${t('manualProgressHelp')}</p>${fresh ? '' : `<p class="small muted">${t('nextReview')}: ${due}</p>`}</section>`;
  const sources = m.source === 'seed' ? `<section class="detail-block source-links"><h3>${t('references')}</h3>${m.references?.length ? m.references.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(trCatalog(r.title))}</a>`).join('') : `<p class="small muted">${t('sourcesPending')}</p>`}</section>` : '';
  const related = variants.length ? `<section class="detail-block"><h3>${t(variants.some(x => x.excerptOf) || parent ? 'relatedSections' : 'relatedVariants')}</h3>${parent ? '' : `<p class="small muted">${t(variants.some(x => x.excerptOf) ? 'excerptHelp' : 'variantProgressHelp')}</p>`}<div class="variant-links">${variants.map(x => `<button class="suggestion" data-act="open" data-id="${x.id}"><b>${esc(mixName(x))}</b>${statusBadge(x.excerptOf ? 'excerpt' : st.progress.get(x.id).status)}</button>`).join('')}</div></section>` : '';
  openSheet(`<div class="sheet-h"><div><h2>${esc(mixName(m))}</h2><div class="muted">${esc(mixSub(m))}</div></div><button class="x" data-act="sheet-close" aria-label="${t('close')}">×</button></div>
    <div class="detail-layout"><div class="detail-main"><div class="detail-overview">${tags}${context}${m.timingOptions?.length ? `<p class="small muted">${t('timingVaries')}: ${m.timingOptions.join(' / ')} ${t('bars', { n: '' }).trim()}</p>` : ''}</div>
      <section class="detail-chant">${body(m.sequence, m.reading, m.layout, 'tok')}</section>
      ${m.extension?.length ? `<section class="detail-extension"><h3 class="small muted">${t('extension')}</h3>${body(m.extension, m.extReading, m.extLayout, 'tok ext')}</section>` : ''}
      ${learningNotes(m).length ? `<p class="notes">${learningNotes(m).map(esc).join('<br>')}</p>` : ''}${m.source === 'seed' && m.notes?.length ? `<details class="source-notes"><summary>${t('sourceNotes')}</summary><p class="notes">${m.notes.map(n => esc(trCatalog(n))).join('<br>')}</p></details>` : ''}</div>
    <aside class="detail-aside">${progress}${sources}${related}<div class="detail-actions"><button class="btn block" data-act="share-mix" data-id="${id}">${t('shareMix')}</button>${m.sourcePending ? '' : `<button class="btn primary block" data-act="d-practice" data-id="${id}">${fresh ? t('unlockStudy') : t('practiceThis')}</button>`}${m.source === 'custom' ? `<button class="btn block" data-act="d-edit" data-id="${id}">${t('editMix')}</button>` : ''}</div></aside></div>`, { className: 'detail-sheet', onClose: onDetailClosed });
}

function shareMix(id) {
  const m = store.get().mixes.find(m => m.id === id);
  if (!m) return;
  const url = new URL(location.href); url.hash = new URLSearchParams({ mix: m.slug, lang: getLang() }).toString();
  const qr = QrCode.encodeText(url.href, QrCode.Ecc.MEDIUM), size = qr.size + 8;
  let path = '';
  for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) path += `M${x + 4},${y + 4}h1v1h-1z `;
  openSheet(`<div class="sheet-h"><h2>${t('shareTitle')}</h2><button class="x" data-act="sheet-close" aria-label="${t('close')}">×</button></div><h3>${esc(mixName(m))}</h3><svg class="share-qr" role="img" aria-label="${t('shareTitle')}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg><p class="small muted">${t(m.source === 'custom' ? 'customShareHelp' : 'qrHelp')}</p><label for="share-url">${t('shareLink')}</label><input class="input" id="share-url" readonly value="${esc(url.href)}"><div class="btns sheet-actions"><button class="btn primary" data-act="copy-link">${t('copyLink')}</button><button class="btn" data-act="open" data-id="${id}">${t('back')}</button></div>`, { onClose: onDetailClosed });
}


// ------------------------------------------------------------------ editor (custom mixes)
function editorChant(m) {
  if (typeof m.chantBody === 'string') return m.chantBody;
  const body = mixToText(m, rowsOf).split('\n').slice(1).join('\n');
  return body + (m.baisoku === 2 ? '\n[倍速]' : '');
}
function openEditor(id) {
  const m = id ? store.get().mixes.find(x => x.id === id) : null;
  const chant = m ? editorChant(m) : '';
  const sh = openSheet(`<div class="sheet-h"><h2>${m ? t('editMix') : t('addMix')}</h2><button class="x" data-act="sheet-close" aria-label="${t('close')}">×</button></div>
    <div class="field"><label for="e-name">${t('mixName')}</label><input id="e-name" class="input" aria-describedby="e-error" value="${esc(m?.name || '')}"></div>
    <div class="field"><label for="e-jp">${t('mixJp')}</label><input id="e-jp" class="input" value="${esc(m?.jp || '')}"></div>
    <div class="row wrap"><div class="field grow"><label for="e-cat">${t('category')}</label><select id="e-cat" class="input" style="width:100%">${CATS.map(c => `<option value="${c}" ${m?.category === c ? 'selected' : ''}>${t(c)}</option>`).join('')}</select></div>
    <div class="field grow"><label for="e-bars">${t('mixTiming')}</label><input id="e-bars" class="input" aria-describedby="e-error" type="number" min="1" max="64" value="${m?.timing || 8}"></div></div>
    <div class="field"><label for="e-trig">${t('mixTrigger')}</label><input id="e-trig" class="input" value="${esc(m?.trigger_context || '')}"></div>
    <div class="field"><label for="e-chant">${t('mixChant')}</label><textarea id="e-chant" class="input" aria-describedby="e-error" spellcheck="false">${esc(chant)}</textarea><div class="help">${t('chantHelp')}</div></div>
    <label class="switch"><span>${t('romajiInput')}<br><span class="small muted">tora → とら · TORA → トラ</span></span><input type="checkbox" id="e-wk"></label>
    <div class="btns sheet-actions"><p class="error" id="e-error" role="alert" hidden></p><button class="btn primary" data-act="e-save" data-id="${id || ''}">${t('save')}</button>${m ? `<button class="btn danger" data-act="e-del" data-id="${id}">${t('deleteMix')}</button>` : ''}<button class="btn" data-act="sheet-close">${t('cancel')}</button></div>`);
  const wk = $('#e-wk', sh);
  wk.addEventListener('change', () => { for (const el of [$('#e-chant', sh), $('#e-jp', sh)]) { try { wk.checked ? bind(el, { IMEMode: 'toKana' }) : unbind(el); } catch {} } });
}
async function saveEditor(id) {
  const name = $('#e-name').value.trim(), body = $('#e-chant').value;
  const old = id ? store.get().mixes.find(x => x.id === id) : null;
  const tokenization = old?.tokenization || ($('#e-cat').value === 'Koujou' ? 'phrases' : 'terms');
  const entry = parseSeedFile('# editor\n' + body)[0], p = parseBody(entry.body);
  const bars = +$('#e-bars').value;
  const missing = [[$('#e-name'), !name], [$('#e-chant'), !p.sequence.length], [$('#e-bars'), !(Number.isInteger(bars) && bars >= 1 && bars <= 64)]];
  missing.forEach(([el, bad]) => bad ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid'));
  $('#e-error').hidden = !missing.some(([, bad]) => bad);
  if (!$('#e-error').hidden) { $('#e-error').textContent = missing.slice(0, 2).some(([, bad]) => bad) ? t('nameChantRequired') : t('barsRange'); missing.find(([, bad]) => bad)[0].focus(); return; }
  const newId = id || crypto.randomUUID?.() || uuidFrom('custom:' + Date.now() + name);
  const before = old && parseBody(parseSeedFile('# editor\n' + editorChant(old))[0].body);
  const rd = (toks, hint, prev, readings, priorHint) => toks.map((x, i) => hint[i] ? toRomaji(hint[i]) : x === prev?.[i] && !priorHint?.[i] ? readings[i] : toRomaji(x));
  const content = old && body === editorChant(old) ? old : {
    sequence: p.sequence, reading: rd(p.sequence, p.readingsHint, old?.sequence, old?.reading, before?.readingsHint), layout: p.layout,
    extension: p.extension, extReading: rd(p.extension, p.extHint, old?.extension, old?.extReading, before?.extHint), extLayout: p.extLayout, extTiming: old?.extTiming || 0,
    initiator: p.initiator === old?.initiatorJp ? old.initiator : p.initiator ? toRomaji(p.initiator) : '', initiatorJp: p.initiator || '', baisoku: p.baisoku || (old && !before.baisoku ? old.baisoku : 0), notes: [...entry.comments, ...p.notes],
  };
  const mix = {
    ...content,
    id: newId, slug: old?.slug || 'custom-' + newId.slice(0, 8), name, jp: $('#e-jp').value.trim(), category: $('#e-cat').value, timing: bars,
    trigger_context: $('#e-trig').value.trim() || '—', chantBody: body,
    source: 'custom', core: false, tier: 3, trending: false, tokenization, order: old?.order ?? 1e6 + store.get().mixes.filter(x => x.source === 'custom').length,
  };
  await saveMix(mix);
  const { mixes, progress } = await loadAll();
  store.set({ mixes, progress });
  closeSheet(); toast(t('saved'));
}

// ------------------------------------------------------------------ stats
async function renderStats() {
  const st = store.get();
  const reviews = await loadReviews();
  if (store.get().tab !== 'stats') return;
  const day = ts => { const d = new Date(ts); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (13 - i)); return d; });
  const counts = days.map(d => reviews.filter(r => day(r.ts) === day(d.getTime())).length);
  const max = Math.max(1, ...counts);
  let streak = 0;
  for (let i = 13; i >= 0; i--) { if (counts[i]) streak++; else if (i === 13) continue; else break; }
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.grade, 0) / reviews.length).toFixed(1) : '—';
  const learning = st.mixes.filter(m => !m.excerptOf && !m.sourcePending), learningIds = new Set(learning.map(m => m.id));
  const byStatus = STATUS_ORDER.map(s => [s, [...st.progress.values()].filter(p => learningIds.has(p.mixId) && p.status === s).length]);
  const weak = learning.map(m => ({ m, p: st.progress.get(m.id) })).filter(x => x.p.status !== STATUS.NOT_LEARNED && (x.p.lapses > 0 || x.p.lastGrade <= 2))
    .sort((a, b) => (b.p.lapses - a.p.lapses) || (a.p.easeFactor - b.p.easeFactor)).slice(0, 6);
  view().innerHTML = `<div class="fadein">
    <h1 class="page-title">${t('stats')}</h1>
    <div class="panel"><div class="stats4"><div class="stat"><b>${reviews.length}</b><span>${t('totalReviews')}</span></div><div class="stat"><b>${avg}</b><span>${t('avgAcc')}</span></div><div class="stat"><b>${streak}</b><span>${t('streakDays')}</span></div><div class="stat"><b>${byStatus[3][1]}</b><span>${t('mastered')}</span></div></div></div>
    <div class="panel"><div class="small muted" style="margin-bottom:8px">${t('reviewsLast14')}</div>
      <div class="bars" role="list">${counts.map((c, i) => `<div role="listitem" style="height:${Math.max(3, (c / max) * 100)}%" title="${days[i].toLocaleDateString(getLang())}: ${c}" aria-label="${days[i].toLocaleDateString(getLang())}: ${t('reviewCount', { n: c })}">${c ? `<span>${c}</span>` : ''}</div>`).join('')}</div>
      <div class="bars-l">${days.map((d, i) => `<span>${!i || d.getDate() === 1 ? `${d.getMonth() + 1}/${d.getDate()}` : d.getDate()}</span>`).join('')}</div></div>
    <div class="panel"><div class="meter" style="height:12px">${byStatus.slice(1).reverse().map(([s, n]) => `<i class="${s === 'MASTERED' ? 'm-mas' : s === 'REMEMBERED' ? 'm-rem' : 'm-learn'}" style="width:${pct(n, learning.length)}%"></i>`).join('')}</div>
      <div class="row wrap small muted" style="margin-top:8px;gap:14px">${byStatus.map(([s, n]) => `<span>${t(s)}: <b style="color:var(--text)">${n}</b></span>`).join('')}</div></div>
    <h2 style="margin:16px 0 4px">${t('weakest')}</h2>
    ${weak.length ? weak.map(({ m, p }) => `<div class="weak"><div><b>${esc(mixName(m))}</b><div class="small muted">${t(p.status)} · ${p.lapses ? t('lapseCount', { n: p.lapses }) : t('recentLowScore')}</div></div><button class="chip" data-act="d-practice" data-id="${m.id}">${t('studyNow')}</button></div>`).join('') : `<div class="empty">${t(reviews.length ? 'nothingWeak' : 'noReviews')}</div>`}</div>`;
}

// ------------------------------------------------------------------ settings
function renderSettings() {
  const s = store.get().settings;
  const seg = (k, opts) => `<div class="seg big">${opts.map(([v, l]) => `<button data-act="setting" data-k="${k}" data-v="${v}" class="${String(s[k]) === String(v) ? 'on' : ''}" aria-pressed="${String(s[k]) === String(v)}">${l}</button>`).join('')}</div>`;
  view().innerHTML = `<div class="fadein">
    <h1 class="page-title">${t('settings')}</h1>
    <div class="field"><label>${t('language')}</label>${seg('lang', [['en', 'English'], ['ja', '日本語']])}</div>
    <div class="field"><label for="oshi">${t('oshi')}</label><input id="oshi" class="input" data-set="oshi" value="${esc(s.oshi)}" placeholder="○○" autocomplete="off"><div class="help">${t('oshiHelp')}</div></div>
    <div class="field"><label>${t('backup')}</label><p class="small muted">${t('backupHelp')}</p><div class="btns" style="margin-top:0"><button class="btn" data-act="export">${t('exportData')}</button><button class="btn" data-act="import">${t('importData')}</button><input type="file" id="file" accept="application/json" hidden></div></div>
    <div class="btns"><button class="btn" data-act="onboard">${t('runSetup')}</button><button class="btn" data-act="add-mix">＋ ${t('addMix')}</button><button class="btn" data-act="bulk-text">${t('bulkText')}</button><button class="btn danger" data-act="reset">${t('reset')}</button></div>
    <p class="muted small" style="margin-top:20px">MIXDEX · ${t('mixCount', { n: store.get().mixes.length })} · ${t('offline')} · ${t(storageMode())}<br>${t('installHint')}</p></div>`;
}


function renderSelBar() {
  const el = $('#selbar');
  if (!el) return;
  if (!selMode) { el.innerHTML = ''; $('#grid') && ($('#grid').style.paddingBottom = ''); document.documentElement.style.removeProperty('--selbar-h'); return; }
  $('#grid').style.paddingBottom = '150px';

  el.innerHTML = `<div class="selbar"><div class="in">
    <div class="seltop"><b>${t('selected', { n: sel.size })}</b><span class="row" style="gap:6px"><button class="chip" data-act="sel-visible">${t('selVisible')}</button><button class="chip" data-act="sel-none">${t('selNone')}</button><button class="chip on" data-act="sel-toggle">${t('done')}</button></span></div>
    <div class="chips"><select class="input" id="sel-tier" aria-label="${t('addTier')}"><option value="">${t('addTier')}</option>${[1, 2, 3].map(n => `<option value="${n}">${n === 1 ? '★ ' : ''}${t('tier' + n)}</option>`).join('')}</select><select class="input" id="sel-mark" aria-label="${t('setProgress')}" ${sel.size ? '' : 'disabled'}><option value="">${t('setProgress')}</option>${[['new', 'markNew'], ['learning', 'markLearning'], ['known', 'markKnown'], ['mastered', 'markMastered']].map(([v, k]) => `<option value="${v}">${t(k)}</option>`).join('')}</select>
      <button class="chip" data-act="sel-practice" ${sel.size ? '' : 'disabled'}>▶ ${t('practiceSelected', { n: sel.size })}</button><button class="chip" data-act="sel-copy" ${sel.size ? '' : 'disabled'}>${t('copyText')}</button></div></div></div>`;
  $('#grid').style.paddingBottom = ($('.selbar', el).offsetHeight + 24) + 'px';
  syncSelbarHeight();
}
function syncSelbarHeight() {
  const bar = $('.selbar');
  if (bar) document.documentElement.style.setProperty('--selbar-h', bar.offsetHeight + 'px');
}
addEventListener('resize', syncSelbarHeight);

const EXAMPLE = `# 自作MIX / 自作MIX | Theme | 8 | 間奏 | id=my-mix
> メモを入力
【発動】しゃー行くぞ
虎 火
人造 繊維
海女 振動
化繊
[飛 除去]`;
const seedSlugs = () => new Set(buildSeed().map(m => m.slug));
const catKey = c => CATS.find(k => [k, t(k)].some(v => v.toLowerCase() === c.toLowerCase()));
const bulkProblem = e => (e.category && !catKey(e.category)) || Number.isNaN(e.timing) || (e.timing !== 0 && !(Number.isInteger(e.timing) && e.timing >= 1 && e.timing <= 64));
function parseBulk(text) {
  const reserved = seedSlugs(), entries = parseSeedFile(text);
  const invalid = entries.filter(bulkProblem).map(e => e.name || '#');
  const rows = entries.filter(e => !bulkProblem(e)).map((e, i) => {
    e.category = e.category ? catKey(e.category) : 'Theme';
    if (!e.timing) e.timing = 8;
    e.trigger = e.trigger || '—';
    const m = entryToMix(e, { source: 'custom', reserved });
    return { ...m, tier: 3, trending: false, order: 1e6 + i };
  }).filter(m => m.sequence.length);
  return { rows, invalid };
}
function openBulkText() {
  const sh = openSheet(`<div class="sheet-h"><h2>${t('bulkText')}</h2><button class="x" data-act="sheet-close" aria-label="${t('close')}">×</button></div>
    <p class="notes">${t('bulkHelp')}</p>
    <textarea id="e-bulk" class="input" aria-label="${esc(t('bulkText'))}" style="min-height:260px;font-family:ui-monospace,monospace;font-size:13px" spellcheck="false"></textarea>
    <div class="small muted" id="bulk-prev" role="status" style="margin:6px 0"></div>
    <label class="switch"><span>${t('romajiInput')}</span><input type="checkbox" id="e-wk"></label>
    <div class="btns"><button class="btn primary" data-act="bulk-apply">${t('bulkApply')}</button><button class="btn" data-act="bulk-load">${t('bulkLoad')}</button><button class="btn" data-act="bulk-example">${t('bulkExample')}</button></div>`);
  const ta = $('#e-bulk', sh), prev = () => { const { rows, invalid } = parseBulk(ta.value), n = rows.length; $('#bulk-prev').textContent = t(n === 1 ? 'bulkPreviewOne' : 'bulkPreview', { n }) + (invalid.length ? ' · ' + t('bulkInvalid', { names: invalid.join(', '), cats: CATS.map(t).join(' / ') }) : ''); $('#bulk-prev').classList.toggle('error', !!invalid.length); $('[data-act="bulk-apply"]', sh).disabled = !n || !!invalid.length; };
  ta.addEventListener('input', prev); prev();
  const wk = $('#e-wk', sh);
  wk.addEventListener('change', () => { try { wk.checked ? bind(ta, { IMEMode: 'toKana' }) : unbind(ta); } catch {} });
}

// ------------------------------------------------------------------ events
const focusKey = el => el.id ? '#' + CSS.escape(el.id) : ['act', 'v', 'id', 'practiceId'].filter(k => el.dataset[k]).map(k => `[data-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${CSS.escape(el.dataset[k])}"]`).join('');
let focusTimers = [];
function restoreFocus(target) {
  const el = target.closest?.('button, select, input');
  const key = el && focusKey(el);
  if (!key) return;
  focusTimers.forEach(clearTimeout);
  const lost = () => !document.activeElement || document.activeElement === document.body || document.activeElement.classList.contains('sheet');
  focusTimers = [0, 60, 200].map(ms => setTimeout(() => { if (lost()) ($(key) || view()).focus({ preventScroll: true }); }, ms));
}
document.addEventListener('click', e => { if (!e.detail) restoreFocus(e.target); }, true);
document.addEventListener('change', e => restoreFocus(e.target), true);
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, v = b.dataset.v, id = b.dataset.id;
  if (act === 'tile' || act === 'opt') return;
  if (practiceAction(act, b)) return;
  switch (act) {
    case 'tab': if (sessionActive()) endSession(); if (location.hash !== routeOf(v)) history.pushState(null, '', routeOf(v)); store.set({ tab: v }); lastTab = null; render(); break;
    case 'lang': updateSettings({ lang: v }); break;
    case 'open': if (selMode) { sel.has(id) ? sel.delete(id) : sel.add(id); renderGrid(); } else openMix(id); break;
    case 'sel-toggle': selMode = !selMode; sel.clear(); renderCodex(); break;
    case 'sel-visible': visibleIds.forEach(x => sel.add(x)); renderGrid(); break;
    case 'sel-none': sel.clear(); renderGrid(); break;
    case 'sel-practice': selectForPractice([...sel], true); selMode = false; sel.clear(); history.pushState(null, '', routeOf('practice')); store.set({ tab: 'practice' }); break;
    case 'sel-copy': {
      const txt = store.get().mixes.filter(m => sel.has(m.id)).map(m => mixToText(m, rowsOf)).join('\n\n');
      try { await navigator.clipboard.writeText(txt); toast(t('copied')); } catch { openBulkText(); $('#e-bulk').value = txt; $('#e-bulk').dispatchEvent(new Event('input')); }
      break;
    }
    case 'onboard': startOnboarding(); break;
    case 'bulk-text': openBulkText(); break;
    case 'bulk-example': $('#e-bulk').value = EXAMPLE; $('#e-bulk').dispatchEvent(new Event('input')); break;
    case 'bulk-load': $('#e-bulk').value = store.get().mixes.filter(m => m.source === 'custom').map(m => mixToText(m, rowsOf)).join('\n\n'); $('#e-bulk').dispatchEvent(new Event('input')); break;
    case 'bulk-apply': {
      const { rows, invalid } = parseBulk($('#e-bulk').value);
      if (!rows.length || invalid.length) { toast(t('bulkBad')); break; }
      await saveMixes(rows);
      const d = await loadAll(); store.set(d); closeSheet(); toast(t('bulkSaved', { n: rows.length })); break;
    }
    case 'share-mix': shareMix(id); break;
    case 'copy-link': {
      try { await navigator.clipboard.writeText($('#share-url').value); toast(t('copied')); } catch { $('#share-url').focus(); $('#share-url').select(); }
      break;
    }
    case 'sheet-close': closeSheet(); break;
    case 'browse-reset': Object.assign(F, { q: '', cat: 'all', tier: 'all', status: 'all' }); renderCodex(); break;
    case 'f-tier': F.tier = v; renderGrid(); break;
    case 'f-group': F.group = v; renderCodex(); break;
    case 'f-cat': F.cat = v; renderGrid(); break;
    case 'f-status': F.status = v; renderGrid(); break;
    case 'd-practice': leaveMixRoute(routeOf('practice')); closeSheet(); if (sessionActive()) endSession(); selectForPractice([id], store.get().tab !== 'practice'); if (location.hash !== routeOf('practice')) history.pushState(null, '', routeOf('practice')); store.set({ tab: 'practice' }); lastTab = null; break;
    case 'd-mark': await bulkMark([id], v); openDetail(id); $(`.sheet [data-act="d-mark"][data-v="${v}"]`)?.focus({ preventScroll: true }); break;
    case 'd-edit': leaveMixRoute(routeOf('codex')); closeSheet(); setTimeout(() => openEditor(id), 280); break;
    case 'add-mix': openEditor(); break;
    case 'e-save': saveEditor(id || null); break;
    case 'e-del': if (confirm(t('deleteMix') + '?')) { await deleteMix(id); const d = await loadAll(); store.set(d); closeSheet(); } break;
    case 'setting': await updateSettings({ [b.dataset.k]: b.dataset.v }); if (b.dataset.k === 'lang') lastLang = null; renderSettings(); break;
    case 'export': {
      try {
        const blob = new Blob([JSON.stringify(await exportAll(), null, 1)], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `mixdex-backup-${new Date().toISOString().slice(0, 10)}.json` });
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(t('exported'));
      } catch { toast(t('backupFailed')); }
      break;
    }
    case 'import': $('#file').click(); break;
    case 'reset': if (confirm(t('resetConfirm'))) { await resetAll(); location.reload(); } break;
  }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'file' && el.files[0]) {
    try {
      await importAll(JSON.parse(await el.files[0].text()));
      const [settings, d] = await Promise.all([loadSettings(), loadAll()]);
      lastTab = null; lastLang = null;
      store.set({ settings, ...d }); toast(t('imported'));
    } catch { toast(t('importError')); }
    finally { el.value = ''; }
  } else if (el.id === 'sel-tier' && el.value) { store.get().mixes.filter(m => !m.excerptOf && !m.sourcePending && m.tier === +el.value).forEach(m => sel.add(m.id)); renderGrid(); }
  else if (el.id === 'sel-mark' && el.value) { const n = await bulkMark([...sel], el.value); sel.clear(); renderGrid(); toast(t('marked', { n })); }
  else if (el.id === 'browse-cat' || el.id === 'browse-tier') { F[el.id.slice(7)] = el.value; renderGrid(); }
  else if (el.id === 'browse-group') { F.group = el.value; renderCodex(); }
  else if (el.id === 'sort') { F.sort = el.value; renderGrid(); }
  else if (el.dataset.set) { const k = el.dataset.set; updateSettings({ [k]: el.type === 'checkbox' ? el.checked : el.dataset.num ? +el.value : el.value }); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('#e-name, #e-chant, #e-bars') && el.hasAttribute('aria-invalid')) { el.removeAttribute('aria-invalid'); $('#e-error').hidden = !$('.sheet [aria-invalid]'); }
  if (el.id === 'q') { F.q = el.value; renderGrid(); }
  else if (el.id === 'oshi') updateSettings({ oshi: el.value });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen()) closeSheet(); });
document.addEventListener('pointermove', e => {
  const c = e.target.closest?.('.card.st-MASTERED');
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
  c.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  c.classList.add('touched');
});

boot();

