import assert from 'node:assert/strict';
import { buildSeed, mixToText, entryToMix, knownSlugs, nextUp } from '../src/seed.js';
import { parseSeedFile, rowsOf } from '../src/parse.js';
const seed = buildSeed();
let bad = 0;
for (const m of seed) {
  const [e] = parseSeedFile(mixToText(m, rowsOf));
  const r = entryToMix(e, { source: 'custom', reserved: new Set() });
  const ok = JSON.stringify(r.sequence) === JSON.stringify(m.sequence) && JSON.stringify(r.extension) === JSON.stringify(m.extension) && JSON.stringify(r.layout) === JSON.stringify(m.layout) && r.timing === m.timing && r.category === m.category;
  if (!ok) { bad++; console.log('ROUNDTRIP FAIL', m.slug, JSON.stringify(r.layout), JSON.stringify(m.layout)); }
}
assert.equal(bad, 0);
// custom slug collision + deterministic id
const [e] = parseSeedFile('# X | Theme | 8 | t | id=standard\nA B');
const a = entryToMix(e, { source: 'custom', reserved: new Set(['standard']) });
assert.equal(a.slug, 'my-standard'); assert.equal(a.source, 'custom');
assert.equal(a.id, entryToMix(e, { source: 'custom', reserved: new Set(['standard']) }).id);
// levels
for (const [lv, n] of [['beginner', 0], ['regular', 3]]) assert.equal(knownSlugs(lv, seed).length, n);
assert.ok(knownSlugs('master', seed).length > knownSlugs('veteran', seed).length);
const known = new Set(seed.filter(m => knownSlugs('veteran', seed).includes(m.slug)).map(m => m.id));
assert.ok(nextUp('veteran', seed, known).every(m => !known.has(m.id)));
console.log('ROUNDTRIP OK', seed.length);
