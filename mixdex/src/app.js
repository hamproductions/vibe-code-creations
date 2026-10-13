import { openDb, syncSeed, loadAll, loadSettings, loadReviews, saveMix, deleteMix, exportAll, importAll, resetAll, storageMode } from './db.js';
import { store, updateSettings } from './state.js';
import { STATUS, STATUS_ORDER } from './srs.js';
import { countQueue } from './engine.js';
import { parseBody } from './parse.js';
import { toRomaji } from './romaji.js';
import { uuidFrom, TIER_LABEL } from './seed.js';
import { setLang, t, getLang } from './i18n.js';
import { esc, $, $$, ICON, hueFor, tokHtml, rowsOf, mixName, mixSub, trig, openSheet, closeSheet, sheetOpen, toast, oshiSub, pct } from './ui.js';
import { renderSetup, startSession, endSession, sessionActive, practiceAction, onBpmInput, onBpmChange } from './practice.js';
import { toHiragana, bind, unbind } from '../vendor/wanakana.mjs';

const view = () => $('#view');
const F = { q: '', cat: 'all', status: 'all', tier: 'all', sort: 'learn', trend: false };
const CATS = ['Basic', 'Language Variant', 'Advanced', 'Koujou', 'Theme'];
const hayCache = new WeakMap();

// ------------------------------------------------------------------ boot
async function boot() {
  try {
    await openDb();
    await syncSeed();
    const settings = await loadSettings();
    const { mixes, progress } = await loadAll();
    setLang(settings.lang);
    store.set({ settings, mixes, progress, ready: true });
  } catch (e) {
    console.error(e);
    view().innerHTML = `<div class="empty">Failed to start: ${esc(e.message)}</div>`;
    return;
  }
  if (storageMode() === 'memory') { const w = $('#storageWarn'); w.hidden = false; w.textContent = t('storageMem'); }
  store.subscribe(() => schedule());
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

let raf = 0;
const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };

// ------------------------------------------------------------------ shell
function renderTabbar() {
  const st = store.get();
  const c = countQueue(st.mixes, st.progress, { newLimit: 0 });
  const tabs = [['codex', ICON.codex], ['practice', ICON.practice], ['stats', ICON.stats], ['settings', ICON.settings]];
  $('#tabbar').innerHTML = tabs.map(([k, ic]) => `<button data-act="tab" data-v="${k}" class="${st.tab === k ? 'on' : ''}" aria-current="${st.tab === k}">${ic}<span>${t(k)}</span>${k === 'practice' && c.due ? `<i class="badge">${c.due}</i>` : ''}</button>`).join('');
  $$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.v === getLang()));
}

let lastTab = null, lastLang = null;
function render() {
  const st = store.get();
  if (!st.ready) return;
  setLang(st.settings.lang);
  renderTabbar();
  if (st.tab === 'practice' && st.session) return;
  const changed = lastTab !== st.tab || lastLang !== getLang();
  lastTab = st.tab; lastLang = getLang();
  if (st.tab === 'codex') { if (changed || !$('#grid')) renderCodex(); else renderGrid(); }
  else if (st.tab === 'practice') renderSetup();
  else if (st.tab === 'stats') renderStats();
  else if (changed || !$('#oshi')) renderSettings();
  if (changed) window.scrollTo(0, 0);
}

// ------------------------------------------------------------------ codex
const hay = m => {
  let h = hayCache.get(m);
  if (!h) {
    const jp = [m.jp, m.trigger_context, ...m.sequence, ...(m.extension || [])].join(' ');
    h = { latin: [m.name, m.category, m.trigger_context, ...m.reading, ...(m.extReading || [])].join(' ').toLowerCase(), kana: toHiragana(jp) };
    hayCache.set(m, h);
  }
  return h;
};
function matches(m, p) {
  if (F.cat !== 'all' && m.category !== F.cat) return false;
  if (F.status !== 'all' && p.status !== F.status) return false;
  if (F.tier !== 'all' && m.tier !== +F.tier) return false;
  if (F.trend && !m.trending) return false;
  const q = F.q.trim().toLowerCase();
  if (!q) return true;
  const h = hay(m);
  if (h.latin.includes(q)) return true;
  const k = toHiragana(q);
  return h.kana.includes(k) || h.kana.includes(toHiragana(q.replace(/\s+/g, '')));
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
    <div class="toolbar"><input id="q" class="input" type="search" placeholder="${esc(t('search'))}" value="${esc(F.q)}" autocomplete="off" autocapitalize="off" aria-label="${esc(t('search'))}">
      <select id="sort" class="input" aria-label="Sort">${[['learn', 'sortLearn'], ['name', 'sortName'], ['due', 'sortDue'], ['status', 'sortStatus']].map(([v, k]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>
    </div>
    <div id="chips"></div><div id="dexline"></div><div id="grid"></div></div>`;
  renderGrid();
}

function chipRow(items, cur, act) {
  return `<div class="chips">${items.map(([v, l]) => `<button class="chip ${String(cur) === String(v) ? 'on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
}

function renderGrid() {
  const st = store.get(), { mixes, progress, settings } = st;
  $('#chips').innerHTML =
    `<div class="chips"><button class="chip ${F.trend ? 'on' : ''}" data-act="f-trend">🔥 ${getLang() === 'ja' ? '人気' : 'Popular'}</button></div>` +
    chipRow([['all', t('all')], [1, '★ ' + t('tier1')], [2, t('tier2')], [3, t('tier3')]], F.tier, 'f-tier') +
    chipRow([['all', t('all')], ...CATS.map(c => [c, t(c)])], F.cat, 'f-cat') +
    chipRow([['all', t('all')], ...STATUS_ORDER.map(s => [s, t(s)])], F.status, 'f-status');
  const n = { l: 0, r: 0, m: 0 };
  progress.forEach(p => { if (p.status === STATUS.LEARNING) n.l++; else if (p.status === STATUS.REMEMBERED) n.r++; else if (p.status === STATUS.MASTERED) n.m++; });
  const tot = mixes.length;
  $('#dexline').innerHTML = `<div class="dexline"><span><b>${n.l + n.r + n.m}</b> / ${tot}</span><div class="meter" aria-hidden="true"><i class="m-mas" style="width:${pct(n.m, tot)}%"></i><i class="m-rem" style="width:${pct(n.r, tot)}%"></i><i class="m-learn" style="width:${pct(n.l, tot)}%"></i></div><span>✨ ${n.m}</span></div>`;
  const list = sorted(mixes.filter(m => matches(m, progress.get(m.id))), progress);
  const no = new Map(mixes.map((m, i) => [m.id, i + 1]));
  const card = m => cardHtml(m, progress.get(m.id), no.get(m.id), settings);
  const grouped = F.sort === 'learn' && F.tier === 'all';
  if (!list.length) $('#grid').innerHTML = `<div class="empty">${t('empty')}</div>`;
  else if (grouped) {
    $('#grid').innerHTML = [1, 2, 3].map(tr => {
      const items = list.filter(m => m.tier === tr);
      if (!items.length) return '';
      const done = items.filter(m => progress.get(m.id).status !== STATUS.NOT_LEARNED).length;
      return `<div class="tier-h"><h2>${tr === 1 ? '★ ' : ''}${t('tier' + tr)}</h2><span>${t('tier' + tr + 'd')}</span><span class="tcount">${done}/${items.length}</span></div><div class="grid">${items.map(card).join('')}</div>`;
    }).join('');
  } else $('#grid').innerHTML = `<div class="grid">${list.map(card).join('')}</div>`;
}

function cardHtml(m, p, no, settings) {
  const locked = p.status === STATUS.NOT_LEARNED;
  const n = m.sequence.length;
  const pips = Array.from({ length: Math.min(n, 14) }, (_, i) => `<i class="${(i * 7 + n) % 3 === 0 ? 'w2' : (i * 5 + n) % 4 === 0 ? 'w3' : ''}"></i>`).join('');
  const name = locked && !settings.revealLocked ? '？？？' : mixName(m);
  const sub = locked && !settings.revealLocked ? '' : mixSub(m);
  return `<button class="card st-${p.status} ${locked ? 'locked' : ''}" style="--hue:${hueFor(m.category)}" data-act="open" data-id="${m.id}" aria-label="${esc(locked && !settings.revealLocked ? t('locked') : mixName(m))}">
    ${locked ? '<span class="silh"></span>' : ''}
    <span class="no"><span>#${String(no).padStart(3, '0')}${m.trending ? ' 🔥' : ''}</span><span class="tier-star">${m.tier === 1 ? '★★' : m.tier === 2 ? '★' : ''}</span></span>
    <span class="name">${esc(name)}</span><span class="jp">${esc(sub)}</span>
    <span class="pips">${pips}</span>
    <span class="meta"><span>${t('bars', { n: m.timing })}</span><span>${locked ? '🔒' : t(p.status)}</span></span>
    ${locked ? `<span class="lock">${ICON.lock}</span>` : ''}</button>`;
}

// ------------------------------------------------------------------ detail
function openDetail(id) {
  const st = store.get(), m = st.mixes.find(x => x.id === id);
  if (!m) return;
  const p = st.progress.get(id), s = st.settings, locked = p.status === STATUS.NOT_LEARNED;
  const body = (toks, ros, layout, cls) => rowsOf(toks.length, layout).map(stz => `<div class="stanza">${stz.map(r => `<div class="line">${r.map(i => locked ? `<span class="tok sil"><span class="a">${'■'.repeat(Math.min(4, Math.max(2, [...toks[i]].length)))}</span></span>` : tokHtml(toks[i], ros[i], s, cls)).join('')}</div>`).join('')}</div>`).join('');
  const due = p.status === STATUS.NOT_LEARNED ? '—' : p.due <= Date.now() ? t('due') : new Date(p.due).toLocaleDateString(getLang());
  openSheet(`<div class="sheet-h"><div><h2>${esc(locked && !s.revealLocked ? mixName(m) : mixName(m))}</h2><div class="muted">${esc(mixSub(m))}</div></div><button class="x" data-act="sheet-close" aria-label="${t('close')}">×</button></div>
    <div class="tags"><span class="tag t1">${m.tier === 1 ? '★ ' : ''}${t('tier' + m.tier)}</span><span class="tag pink">${t(m.category)}</span><span class="tag">${t('bars', { n: m.timing })}</span><span class="tag">${t('words', { n: m.sequence.length })}</span>${m.baisoku ? `<span class="tag">⚡ ${t('baisokuTag')} ${m.baisoku}×</span>` : ''}${m.trending ? '<span class="tag">🔥</span>' : ''}${m.source === 'custom' ? `<span class="tag">${t('custom')}</span>` : ''}<span class="tag cy">${t(p.status)}</span></div>
    <dl class="kv"><dt>${t('trigger')}</dt><dd>${esc(trig(m))}</dd>${m.initiator || m.initiatorJp ? `<dt>${t('initiator')}</dt><dd>🔔 ${esc(oshiSub(s.script === 'romaji' ? m.initiator : m.initiatorJp || m.initiator, s))}</dd>` : ''}</dl>
    ${body(m.sequence, m.reading, m.layout, 'tok')}
    ${m.extension?.length ? `<div class="small muted">${t('extension')}</div>${body(m.extension, m.extReading, m.extLayout, 'tok ext')}` : ''}
    ${!locked && m.notes?.length ? `<p class="notes">${m.notes.map(esc).join('<br>')}</p>` : ''}
    ${locked ? '' : `<div class="panel"><div class="stats4"><div class="stat"><b>${p.streak}</b><span>Streak</span></div><div class="stat"><b>${p.easeFactor.toFixed(1)}</b><span>Ease</span></div><div class="stat"><b>${p.interval}</b><span>${t('days')}</span></div><div class="stat"><b>${due}</b><span>${t('nextReview')}</span></div></div></div>`}
    <div class="btns"><button class="btn primary" data-act="d-practice" data-id="${id}">${locked ? t('unlockStudy') : t('practiceThis')}</button>
    ${m.source === 'custom' ? `<button class="btn" data-act="d-edit" data-id="${id}">${t('editMix')}</button>` : ''}</div>`);
}

// ------------------------------------------------------------------ editor (custom mixes)
function openEditor(id) {
  const m = id ? store.get().mixes.find(x => x.id === id) : null;
  const chant = m ? rowsOf(m.sequence.length, m.layout).map(stz => stz.map(r => r.map(i => m.sequence[i]).join(' ')).join('\n')).join('\n\n') + (m.extension?.length ? '\n[' + m.extension.join(' ') + ']' : '') : '';
  const sh = openSheet(`<div class="sheet-h"><h2>${m ? t('editMix') : t('addMix')}</h2><button class="x" data-act="sheet-close" aria-label="${t('close')}">×</button></div>
    <div class="field"><label>${t('mixName')}</label><input id="e-name" class="input" value="${esc(m?.name || '')}"></div>
    <div class="field"><label>${t('mixJp')}</label><input id="e-jp" class="input" value="${esc(m?.jp || '')}"></div>
    <div class="row wrap"><div class="field grow"><label>${t('category')}</label><select id="e-cat" class="input" style="width:100%">${CATS.map(c => `<option value="${c}" ${m?.category === c ? 'selected' : ''}>${t(c)}</option>`).join('')}</select></div>
    <div class="field grow"><label>${t('mixTiming')}</label><input id="e-bars" class="input" type="number" min="1" max="64" value="${m?.timing || 8}"></div></div>
    <div class="field"><label>${t('mixTrigger')}</label><input id="e-trig" class="input" value="${esc(m?.trigger_context || '')}"></div>
    <div class="field"><label>${t('mixChant')}</label><textarea id="e-chant" class="input" spellcheck="false">${esc(chant)}</textarea><div class="help">${t('chantHelp')}</div></div>
    <label class="switch"><span>${t('romajiInput')}<br><span class="small muted">tora → とら · TORA → トラ</span></span><input type="checkbox" id="e-wk"></label>
    <div class="btns"><button class="btn primary" data-act="e-save" data-id="${id || ''}">${t('save')}</button>${m ? `<button class="btn danger" data-act="e-del" data-id="${id}">${t('deleteMix')}</button>` : ''}<button class="btn" data-act="sheet-close">${t('cancel')}</button></div>`);
  const wk = $('#e-wk', sh);
  wk.addEventListener('change', () => { for (const el of [$('#e-chant', sh), $('#e-jp', sh)]) { try { wk.checked ? bind(el, { IMEMode: 'toKana' }) : unbind(el); } catch {} } });
}
async function saveEditor(id) {
  const name = $('#e-name').value.trim(), body = $('#e-chant').value;
  const p = parseBody(body);
  if (!name || !p.sequence.length) { toast(t('mixName') + ' / ' + t('mixChant')); return; }
  const old = id ? store.get().mixes.find(x => x.id === id) : null;
  const newId = id || crypto.randomUUID?.() || uuidFrom('custom:' + Date.now() + name);
  const rd = (toks, hint) => toks.map((x, i) => (hint[i] ? toRomaji(hint[i]) : toRomaji(x)));
  const mix = {
    id: newId, slug: old?.slug || 'custom-' + newId.slice(0, 8), name, jp: $('#e-jp').value.trim(), category: $('#e-cat').value, timing: +$('#e-bars').value || 8,
    sequence: p.sequence, reading: rd(p.sequence, p.readingsHint), layout: p.layout, extension: p.extension, extReading: rd(p.extension, p.extHint), extLayout: p.extLayout, extTiming: 0,
    trigger_context: $('#e-trig').value.trim() || '—', initiator: p.initiator ? toRomaji(p.initiator) : '', initiatorJp: p.initiator || '', baisoku: p.baisoku, notes: p.notes,
    source: 'custom', core: false, tier: 3, trending: false, order: old?.order ?? 1e6 + store.get().mixes.filter(x => x.source === 'custom').length,
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
  const byStatus = STATUS_ORDER.map(s => [s, [...st.progress.values()].filter(p => p.status === s).length]);
  const weak = st.mixes.map(m => ({ m, p: st.progress.get(m.id) })).filter(x => x.p.status !== STATUS.NOT_LEARNED && (x.p.lapses > 0 || x.p.lastGrade < 4))
    .sort((a, b) => (b.p.lapses - a.p.lapses) || (a.p.easeFactor - b.p.easeFactor)).slice(0, 6);
  view().innerHTML = `<div class="fadein">
    <div class="panel"><div class="stats4"><div class="stat"><b>${reviews.length}</b><span>${t('totalReviews')}</span></div><div class="stat"><b>${avg}</b><span>${t('avgAcc')}</span></div><div class="stat"><b>${streak}</b><span>${t('streakDays')}</span></div><div class="stat"><b>${byStatus[3][1]}</b><span>${t('mastered')}</span></div></div></div>
    <div class="panel"><div class="small muted" style="margin-bottom:8px">${t('reviewsLast14')}</div>
      <div class="bars">${counts.map((c, i) => `<div style="height:${Math.max(3, (c / max) * 100)}%" title="${days[i].toLocaleDateString()}: ${c}"></div>`).join('')}</div>
      <div class="bars-l">${days.map(d => `<span>${d.getDate()}</span>`).join('')}</div></div>
    <div class="panel"><div class="meter" style="height:12px">${byStatus.slice(1).reverse().map(([s, n]) => `<i class="${s === 'MASTERED' ? 'm-mas' : s === 'REMEMBERED' ? 'm-rem' : 'm-learn'}" style="width:${pct(n, st.mixes.length)}%"></i>`).join('')}</div>
      <div class="row wrap small muted" style="margin-top:8px;gap:14px">${byStatus.map(([s, n]) => `<span>${t(s)}: <b style="color:var(--text)">${n}</b></span>`).join('')}</div></div>
    <h2 style="margin:16px 0 4px">${t('weakest')}</h2>
    ${weak.length ? weak.map(({ m, p }) => `<div class="weak"><div><b>${esc(mixName(m))}</b><div class="small muted">${t(p.status)} · ${p.lapses}× ${getLang() === 'ja' ? 'ミス' : 'lapse'}</div></div><button class="chip" data-act="d-practice" data-id="${m.id}">${t('studyNow')}</button></div>`).join('') : `<div class="empty">${t('noReviews')}</div>`}</div>`;
}

// ------------------------------------------------------------------ settings
function renderSettings() {
  const s = store.get().settings;
  const seg = (k, opts) => `<div class="seg big">${opts.map(([v, l]) => `<button data-act="setting" data-k="${k}" data-v="${v}" class="${String(s[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const sw = (k, label) => `<label class="switch"><span>${label}</span><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}></label>`;
  view().innerHTML = `<div class="fadein">
    <div class="field"><label>${t('language')}</label>${seg('lang', [['en', 'English'], ['ja', '日本語']])}</div>
    <div class="field"><label>${t('chantScript')}</label>${seg('script', [['jp', t('scriptJp')], ['romaji', t('scriptRomaji')], ['both', t('scriptBoth')]])}</div>
    <div class="field"><label for="oshi">${t('oshi')}</label><input id="oshi" class="input" data-set="oshi" value="${esc(s.oshi)}" placeholder="○○" autocomplete="off"><div class="help">${t('oshiHelp')}</div></div>
    <div class="field"><label for="npd">${t('newPerDay')}: <b id="npdv">${s.newPerDay}</b></label><input id="npd" type="range" min="0" max="20" value="${s.newPerDay}" data-set="newPerDay" data-num="1"></div>
    <div class="field"><label for="lat">${t('latency')}: <b id="latv">${s.latency}</b></label><input id="lat" type="range" min="-150" max="250" step="10" value="${s.latency}" data-set="latency" data-num="1"></div>
    <div class="panel">${sw('includeExt', t('includeExt'))}${sw('sound', t('sound'))}${sw('haptics', t('haptics'))}${sw('revealLocked', t('revealLocked'))}</div>
    <div class="field"><label>${t('backup')}</label><div class="btns" style="margin-top:0"><button class="btn" data-act="export">${t('exportData')}</button><button class="btn" data-act="import">${t('importData')}</button><input type="file" id="file" accept="application/json" hidden></div></div>
    <div class="btns"><button class="btn" data-act="add-mix">＋ ${t('addMix')}</button><button class="btn danger" data-act="reset">${t('reset')}</button></div>
    <p class="muted small" style="margin-top:20px">MIXDEX · ${store.get().mixes.length} mixes · ${t('offline')} · ${storageMode()}<br>${t('installHint')}</p></div>`;
}

// ------------------------------------------------------------------ events
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, v = b.dataset.v, id = b.dataset.id;
  if (act === 'tile' || act === 'opt') return;
  if (practiceAction(act, b)) return;
  switch (act) {
    case 'tab': if (sessionActive()) endSession(); store.set({ tab: v }); lastTab = null; render(); break;
    case 'lang': updateSettings({ lang: v }); break;
    case 'open': openDetail(id); break;
    case 'sheet-close': closeSheet(); break;
    case 'f-tier': F.tier = v; renderGrid(); break;
    case 'f-cat': F.cat = v; renderGrid(); break;
    case 'f-status': F.status = v; renderGrid(); break;
    case 'f-trend': F.trend = !F.trend; renderGrid(); break;
    case 'd-practice': closeSheet(); if (sessionActive()) endSession(); store.set({ tab: 'practice' }); await startSession([id]); break;
    case 'd-edit': closeSheet(); setTimeout(() => openEditor(id), 280); break;
    case 'add-mix': openEditor(); break;
    case 'e-save': saveEditor(id || null); break;
    case 'e-del': if (confirm(t('deleteMix') + '?')) { await deleteMix(id); const d = await loadAll(); store.set(d); closeSheet(); } break;
    case 'setting': await updateSettings({ [b.dataset.k]: b.dataset.v }); if (b.dataset.k === 'lang') lastLang = null; renderSettings(); break;
    case 'export': {
      const blob = new Blob([JSON.stringify(await exportAll(), null, 1)], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `mixdex-backup-${new Date().toISOString().slice(0, 10)}.json` });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(t('exported')); break;
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
      store.set({ settings, ...d }); toast(t('imported'));
    } catch (err) { toast(err.message); }
  } else if (el.id === 'sort') { F.sort = el.value; renderGrid(); }
  else if (el.dataset.set) { const k = el.dataset.set; updateSettings({ [k]: el.type === 'checkbox' ? el.checked : el.dataset.num ? +el.value : el.value }); }
  else if (el.dataset.act === 'bpm') onBpmChange(el);
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'q') { F.q = el.value; renderGrid(); }
  else if (el.dataset.act === 'bpm') onBpmInput(el);
  else if (el.id === 'npd') $('#npdv').textContent = el.value;
  else if (el.id === 'lat') $('#latv').textContent = el.value;
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
