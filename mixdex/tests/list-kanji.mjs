import { buildSeed } from '../src/seed.js';
import { needsKanjiEntry } from '../src/romaji.js';
const set = new Set();
for (const m of buildSeed()) for (const t of [...m.sequence, ...m.extension, m.initiatorJp]) if (t) for (const x of t.match(/[一-鿿々]+/g) || []) set.add(x);
console.log([...set].join(' '));
