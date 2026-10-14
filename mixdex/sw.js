const CACHE = 'mixdex-v84';
const SHELL = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.svg',
  'src/app.js', 'src/practice.js', 'src/onboarding.js', 'src/ui.js', 'src/state.js', 'src/db.js', 'src/store.js', 'src/i18n.js', 'src/catalogJa.js', 'src/audio.js', 'src/engine.js',
  'src/srs.js', 'src/interference.js', 'src/seed.js', 'src/seedText.js', 'src/parse.js', 'src/romaji.js', 'src/kanjiDict.js',
  'vendor/qrcodegen.mjs', 'vendor/dexie.mjs', 'vendor/wanakana.mjs'];
const SHELL_REQUESTS = SHELL.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' }));
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL_REQUESTS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r, { cache: 'no-store' }).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return net;
  }));
});
