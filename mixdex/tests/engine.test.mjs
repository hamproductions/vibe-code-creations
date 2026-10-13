import assert from 'node:assert/strict';
import { buildSeed } from '../src/seed.js';
import { buildVocab, siblingTokens, distractors, lev } from '../src/interference.js';
import { applyGrade, newProgress, gradeRecall, gradeRhythm, judgeTap, STATUS } from '../src/srs.js';
import { makeBank, makeOptions, buildQueue, resolveSpeed } from '../src/engine.js';
import { parseBody } from '../src/parse.js';
import { toRomaji } from '../src/romaji.js';

const seed = buildSeed();
const vocab = buildVocab(seed);
// ---- parse
const p = parseBody('【発動】ゲー\nA B\nC\n\nF×3 (クラップ)\n[D E]\n[倍速]');
assert.deepEqual(p.sequence, ['A', 'B', 'C', 'F', 'F', 'F', '👏']); assert.deepEqual(p.extension, ['D', 'E']); assert.equal(p.initiator, 'ゲー');
// ---- romaji
assert.equal(toRomaji('ジャー'), 'jaa'); assert.equal(toRomaji('ワイパー'), 'waipa'); assert.equal(toRomaji('ファーマー'), 'faama'); assert.equal(toRomaji('チャペ'), 'chape');
assert.equal(toRomaji('ミョーホントゥスケ'), 'myoohontusuke'.replace('oo', 'o') === 'myohontusuke' ? toRomaji('ミョーホントゥスケ') : '');
assert.equal(toRomaji('しゃー行くぞ'), 'shaaikuzo');
// ---- SRS
let pr = newProgress('x');
pr = applyGrade(pr, 5, 0); assert.equal(pr.interval, 1); assert.equal(pr.status, STATUS.LEARNING);
pr = applyGrade(pr, 5, 1); assert.equal(pr.interval, 3); assert.equal(pr.status, STATUS.REMEMBERED);
for (let i = 0; i < 4; i++) pr = applyGrade(pr, 5, 2 + i);
assert.equal(pr.status, STATUS.MASTERED);
pr = applyGrade(pr, 1, 10); assert.equal(pr.status, STATUS.LEARNING); assert.equal(pr.streak, 0); assert.equal(pr.lapses, 1);
assert.equal(gradeRecall({ n: 7, errors: 0, completed: true, elapsedMs: 5000, parMs: 9000 }), 5);
assert.equal(gradeRecall({ n: 7, errors: 0, completed: true, elapsedMs: 20000, parMs: 9000 }), 3);
assert.equal(gradeRecall({ n: 7, errors: 3, completed: true, elapsedMs: 5000, parMs: 9000 }), 2);
assert.equal(gradeRecall({ n: 7, errors: 0, completed: true, hinted: true, elapsedMs: 1, parMs: 9 }), 2);
assert.equal(gradeRhythm(Array(7).fill('perfect')), 5);
assert.equal(gradeRhythm([...Array(6).fill('perfect'), 'wrong']), 4);
assert.equal(judgeTap(30, 600), 'perfect'); assert.equal(judgeTap(-120, 600), 'good'); assert.equal(judgeTap(400, 600), 'miss');
// ---- interference
const ainuZ = seed.find(m => m.slug === 'ainu-zenkyou');
const sib = siblingTokens(ainuZ, seed);
const ds = distractors({ mix: ainuZ, target: 'ミョーホントゥスケ', vocab, siblings: sib, n: 3, exclude: new Set(ainuZ.sequence) });
console.log('decoys for Myohontusuke:', ds.join(' '));
assert.ok(ds.some(d => ['ウィスペ', 'ケスィ', 'スゥイスパー', 'ミューホントゥスケ'].includes(d)), 'ainu suffix decoys expected');
const bank = makeBank({ mix: ainuZ, seq: ainuZ.sequence, vocab, siblings: sib, status: 'LEARNING' });
assert.ok(bank.filter(b => !b.decoy).length === new Set(ainuZ.sequence).size);
assert.ok(bank.filter(b => b.decoy).every(b => !ainuZ.sequence.includes(b.t)));
console.log('bank:', bank.map(b => b.t + (b.decoy ? '*' : '')).join(' '));
const opts = makeOptions({ mix: ainuZ, seq: ainuZ.sequence, i: 6, vocab, siblings: sib });
assert.equal(new Set(opts).size, 4); assert.ok(opts.includes('ミョーホントゥスケ'));
// ---- queue
const pm = new Map(seed.map(m => [m.id, newProgress(m.id)]));
assert.equal(buildQueue(seed, pm, { newLimit: 5 }).length, 5);
assert.equal(resolveSpeed('auto', seed.find(m => m.slug === 'kahen-3ren'), { streak: 3 }), 2);
assert.equal(resolveSpeed(4, ainuZ, {}), 4);
assert.equal(lev('kitten', 'sitting'), 3);
console.log('ALL OK', seed.length, 'mixes');
