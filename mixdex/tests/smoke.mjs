// Browser smoke test: node tests/smoke.mjs  (needs playwright + chromium; serves ./ on :8765)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const out = process.env.SHOTS || '/tmp/claude-0/shots'; mkdirSync(out, { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', '8765', '-d', new URL('..', import.meta.url).pathname], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text()); });
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
await page.goto('http://localhost:8765/');
await page.waitForSelector('#onboard');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/00-onboard-1.png' });
await page.click('[data-ob="next"]');
await page.click('[data-ob="level"][data-v="beginner"]');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/00-onboard-2.png' });
await page.click('[data-ob="next"]');
ok((await page.locator('#kcount').innerText()).includes('0'), 'beginner knows nothing');
await page.click('[data-ob="finish"]');
await page.waitForSelector('#onboard', { state: 'detached' });
await page.click('.tabbar [data-v="codex"]');
await page.waitForSelector('.card');
ok((await page.locator('.card').count()) === 124, '124 cards in codex');
ok((await page.locator('.tier-h').count()) === 3, '3 tier sections');
ok((await page.locator('.tier-h h2').first().innerText()).includes('Essential'), 'Essential first');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/01-codex.png' });
// search with romaji → kana
await page.fill('#q', 'tora');
ok((await page.locator('.card').count()) > 3, 'search "tora" finds mixes');
await page.fill('#q', 'jinzou');
ok((await page.locator('.card').count()) > 3, 'romaji search matches kanji readings');
await page.fill('#q', 'ainu');
await page.waitForTimeout(100);
await page.fill('#q', '');
// lang switch
await page.click('.lang [data-v="ja"]');
ok((await page.locator('.tabbar').innerText()).includes('図鑑'), 'JA UI');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/02-codex-ja.png' });
await page.click('.lang [data-v="en"]');
// session on Standard MIX: bank mode
await page.evaluate(async () => {
  const { store, updateSettings } = await import('/src/state.js');
  await updateSettings({ mode: 'bank' });
  window.__st = store;
});
await page.locator('.card').first().click();
await page.waitForSelector('.sheet');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/03-detail-locked.png' });
await page.click('[data-act="d-practice"]');
await page.waitForSelector('[data-act="s-ready"]');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/04-study.png' });
await page.click('[data-act="s-ready"]');
await page.waitForSelector('#bank');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/05-bank.png' });
const seq = await page.evaluate(() => { const s = window.__st.get(); return s.mixes.find(m => m.slug === 'standard').sequence; });
// one wrong tap first
const tiles = await page.$$('.tile');
for (const t of tiles) { const txt = await t.innerText(); if (!seq.includes(txt.trim())) { await t.dispatchEvent('pointerdown'); break; } }
for (const w of seq) {
  const el = await page.locator('.tile', { hasText: new RegExp('^' + w + '$') }).first();
  await el.dispatchEvent('pointerdown');
}
await page.waitForSelector('.gradebig');
const grade = await page.locator('.gradebig').innerText();
ok(+grade >= 3 && +grade <= 5, 'grade after 1 error = ' + grade);
await page.waitForTimeout(450); await page.screenshot({ path: out + '/06-result.png' });
const pr = await page.evaluate(() => { const s = window.__st.get(); const m = s.mixes.find(x => x.slug === 'standard'); return s.progress.get(m.id); });
ok(pr.status === 'LEARNING' && pr.reviews === 1, 'progress persisted → LEARNING');
// rhythm mode on Japanese
await page.evaluate(async () => { const { updateSettings } = await import('/src/state.js'); await updateSettings({ mode: 'rhythm', bpm: 70 }); });
await page.click('[data-act="s-quit"]');
await page.click('.tabbar [data-v="codex"]');
const jid = await page.evaluate(() => window.__st.get().mixes.find(m => m.slug === 'japanese').id);
await page.locator(`.card[data-id="${jid}"]`).click();
await page.click('[data-act="d-practice"]');
await page.click('[data-act="s-ready"]');
await page.click('[data-act="s-rstart"]');
await page.waitForSelector('.opt', { timeout: 8000 });
await page.screenshot({ path: out + '/07-rhythm.png' });
const jseq = await page.evaluate(() => window.__st.get().mixes.find(m => m.slug === 'japanese').sequence);
for (let i = 0; i < jseq.length; i++) {
  await page.waitForFunction(i => document.querySelector('#slots .slot.cur')?.dataset.i === String(i), i, { timeout: 5000, polling: 10 });
  await page.evaluate(w => { const o = [...document.querySelectorAll('.opt')].find(x => x.querySelector('.a').textContent.trim() === w); o.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, jseq[i]);
}
await page.waitForSelector('.gradebig', { timeout: 6000 });
ok(true, 'rhythm finished, grade ' + (await page.locator('.gradebig').innerText()));
await page.waitForTimeout(450); await page.screenshot({ path: out + '/08-rhythm-result.png' });
await page.click('[data-act="s-quit"]');
// stats, settings
await page.click('.tabbar [data-v="stats"]'); await page.waitForSelector('.bars'); await page.waitForTimeout(450); await page.screenshot({ path: out + '/09-stats.png' });
await page.click('.tabbar [data-v="settings"]'); await page.fill('#oshi', 'みお'); ok((await page.inputValue('#oshi')) === 'みお', 'oshi input keeps focus value');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/10-settings.png' });
// mastered foil card
await page.evaluate(async () => {
  const { store } = await import('/src/state.js');
  const m = store.get().mixes[0]; const p = new Map(store.get().progress);
  p.set(m.id, { ...p.get(m.id), status: 'MASTERED', interval: 30, streak: 6 }); store.set({ progress: p });
});
await page.click('.tabbar [data-v="codex"]'); await page.waitForSelector('.card.st-MASTERED');
await page.waitForTimeout(450); await page.screenshot({ path: out + '/11-foil.png' });
ok(errors.length === 0, 'no console errors ' + errors.join(' | '));

// ---- veteran onboarding + bulk select + bulk text (fresh storage)
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
const p2 = await ctx2.newPage();
p2.on('pageerror', e => errors.push('pageerror2 ' + e.message));
await p2.goto('http://localhost:8765/');
await p2.waitForSelector('#onboard');
await p2.click('[data-ob="next"]');
await p2.click('[data-ob="level"][data-v="veteran"]');
await p2.click('[data-ob="next"]');
const kc = await p2.locator('#kcount').innerText();
ok(/1[5-9]|2\d/.test(kc), 'veteran pre-ticks known mixes: ' + kc);
await p2.waitForTimeout(450); await p2.screenshot({ path: out + '/00-onboard-3.png' });
await p2.click('[data-ob="finish"]');
await p2.waitForSelector('#onboard', { state: 'detached' });
await p2.evaluate(async () => { window.__st = (await import('/src/state.js')).store; });
const rem = await p2.evaluate(() => [...window.__st.get().progress.values()].filter(p => p.status === 'REMEMBERED').length);
ok(rem >= 15, 'veteran: ' + rem + ' mixes marked Remembered');
ok((await p2.evaluate(() => window.__st.get().settings.speed)) === 'auto', 'veteran gets auto baisoku');
await p2.waitForTimeout(450); await p2.screenshot({ path: out + '/12-practice-veteran.png' });
await p2.click('.tabbar [data-v="codex"]');
await p2.click('[data-act="sel-toggle"]');
await p2.click('[data-act="sel-tier"][data-v="3"]');
const selTxt = await p2.locator('.selbar b').innerText();
ok(/\d+/.test(selTxt) && !selTxt.startsWith('0'), 'bulk select tier 3: ' + selTxt);
await p2.click('[data-act="sel-mark"][data-v="learning"]');
await p2.waitForTimeout(300);
const lrn = await p2.evaluate(() => [...window.__st.get().progress.values()].filter(p => p.status === 'LEARNING').length);
ok(lrn >= 80, 'bulk mark learning: ' + lrn);
await p2.waitForTimeout(450); await p2.screenshot({ path: out + '/13-bulk-select.png' });
await p2.click('[data-act="sel-toggle"]');
// nothing locked: a New mix opens with full sequence
await p2.click('.tabbar [data-v="settings"]');
await p2.click('[data-act="bulk-text"]');
await p2.click('[data-act="bulk-example"]');
await p2.click('[data-act="bulk-apply"]');
await p2.waitForTimeout(400);
ok((await p2.evaluate(() => window.__st.get().mixes.filter(m => m.source === 'custom').length)) === 1, 'bulk text import creates a custom mix');
await p2.click('.tabbar [data-v="codex"]');
ok((await p2.locator('.card').count()) === 125, '125 cards after bulk import');
ok(!(await p2.content()).includes('🔒'), 'no lock icons anywhere');
await p2.waitForTimeout(450); await p2.screenshot({ path: out + '/14-codex-veteran.png' });
ok(errors.length === 0, 'no errors in 2nd context ' + errors.join(' | '));
await browser.close(); srv.kill();
