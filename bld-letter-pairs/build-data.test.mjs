import assert from 'node:assert/strict';
import {
    parseColpiAnki,
    parseColpiCsv,
    parseSpeedsolvingWiki,
    mergePairData
} from './build-data.mjs';

const csv = 'en,A,B,C\nA,"AA BATTERY","ABS","AIR CONDITIONER"\nB,"BANANA","BABY","BACON"\n';
const anki = 'AA AA BATTERY<br>AARON\nAB ABS\nABACUS\nAC AIR CONDITIONER\nACE\nBA BANANA\nBATMAN\n';
const wiki = `=A=
==AA==
* Aardvark
* [[Anti-aircraft]]

==AB==
* Abs
* [[Ali Baba]]

=B=
==BA==
* Bagel
* Batman`;

const colpiCsv = parseColpiCsv(csv);
const colpiAnki = parseColpiAnki(anki);
const speedsolving = parseSpeedsolvingWiki(wiki);
const merged = mergePairData([colpiCsv, colpiAnki, speedsolving]);

assert.deepEqual(colpiCsv.AA, ['AA BATTERY']);
assert.deepEqual(colpiCsv.BC, ['BACON']);
assert.deepEqual(colpiAnki.AA, ['AA BATTERY', 'AARON']);
assert.deepEqual(colpiAnki.AB, ['ABS', 'ABACUS']);
assert.deepEqual(speedsolving.AB, ['Abs', 'Ali Baba']);
assert.equal(merged.AA.pair, 'AA');
assert.equal(merged.AA.entries[0].term, 'AA BATTERY');
assert.deepEqual(merged.AA.entries[0].sources, ['CoLPI CSV', 'CoLPI Anki']);
assert.equal(merged.AA.entries.some((entry) => entry.term === 'Aardvark'), true);
assert.equal(merged.AB.entries.length, 3);
assert.equal(Object.keys(merged).length, 6);
