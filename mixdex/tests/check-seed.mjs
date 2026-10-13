import { buildSeed } from '../src/seed.js';
const seed = buildSeed();
let bad = 0;
for (const m of seed) {
  const lsum = m.layout.reduce((a, b) => a + b, 0);
  if (lsum !== m.sequence.length) { console.log('LAYOUT', m.slug, lsum, m.sequence.length); bad++; }
  const elsum = m.extLayout.reduce((a, b) => a + b, 0);
  if (elsum !== m.extension.length) { console.log('EXTLAYOUT', m.slug, elsum, m.extension.length); bad++; }
  for (const r of [...m.reading, ...m.extReading]) if (/[぀-ヿ一-鿿]/.test(r)) { console.log('UNROMANISED', m.slug, r); bad++; }
  if (!m.sequence.length) { console.log('EMPTY', m.slug); bad++; }
}
console.log(seed.length, 'mixes', bad, 'problems');
for (const s of ['standard','kahen-3ren','tata-3','pegasus','jp-gyaku','spanish-3','gachikoi-mix','kishoten']) { const m = seed.find(x=>x.slug===s); if(!m){console.log('missing',s);continue;} console.log(s, m.timing, m.layout.join(','), '|', m.sequence.slice(0,12).join(' '), '|', m.reading.slice(0,12).join(' '), '| ext', m.extension.join(' '), '| bais', m.baisoku, '| init', m.initiatorJp); }
