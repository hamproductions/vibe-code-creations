(() => {
const R90 = {
  x: { 1: ([x, y, z]) => [x, -z, y], [-1]: ([x, y, z]) => [x, z, -y] },
  y: { 1: ([x, y, z]) => [z, y, -x], [-1]: ([x, y, z]) => [-z, y, x] },
  z: { 1: ([x, y, z]) => [-y, x, z], [-1]: ([x, y, z]) => [y, -x, z] },
}
const AX = { x: 0, y: 1, z: 2 }
const MOVES = {
  R: ['x', -1, (v) => v === 1], L: ['x', 1, (v) => v === -1], M: ['x', 1, (v) => v === 0],
  r: ['x', -1, (v) => v >= 0], l: ['x', 1, (v) => v <= 0], x: ['x', -1, () => true],
  U: ['y', -1, (v) => v === 1], D: ['y', 1, (v) => v === -1], E: ['y', 1, (v) => v === 0],
  u: ['y', -1, (v) => v >= 0], d: ['y', 1, (v) => v <= 0], y: ['y', -1, () => true],
  F: ['z', -1, (v) => v === 1], B: ['z', 1, (v) => v === -1], S: ['z', -1, (v) => v === 0],
  f: ['z', -1, (v) => v >= 0], b: ['z', 1, (v) => v <= 0], z: ['z', -1, () => true],
}
const SLOTS = []
for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
  if (x || y || z) for (const n of [[x, 0, 0], [0, y, 0], [0, 0, z]]) if (n.some(Boolean)) SLOTS.push({ p: [x, y, z], n })
}
const key = (p, n) => `${p}|${n}`
const INDEX = new Map(SLOTS.map((s, i) => [key(s.p, s.n), i]))
const identity = () => SLOTS.map((_, i) => i)
const compose = (a, b) => a.map((_, i) => a[b[i]])
const invert = (a) => { const o = []; a.forEach((v, i) => { o[v] = i }); return o }
const basePerm = (name) => {
  const [axis, dir, pick] = MOVES[name]
  const rot = R90[axis][dir]
  const out = identity()
  SLOTS.forEach((s, i) => {
    if (pick(s.p[AX[axis]])) out[INDEX.get(key(rot(s.p), rot(s.n)))] = i
  })
  return out
}
const parse = (alg) => alg.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean)
const tokenPerm = (t) => {
  const b = basePerm(t[0])
  if (t[1] === '2') return compose(b, b)
  if (t[1] === "'") return invert(b)
  return b
}
const CENTERS = ['U', 'F'].map((f) => (f === 'U' ? INDEX.get(key([0, 1, 0], [0, 1, 0])) : INDEX.get(key([0, 0, 1], [0, 0, 1]))))
const ROTS = []
for (const a of ['', 'x', 'x2', "x'", 'z', "z'"]) for (const b of ['', 'y', 'y2', "y'"]) {
  ROTS.push(`${a} ${b}`.trim())
}
const raw = (alg) => parse(alg).reduce((s, t) => compose(s, tokenPerm(t)), identity())
const perm = (alg) => {
  const s = raw(alg)
  for (const r of ROTS) {
    const n = compose(s, raw(r))
    if (CENTERS.every((c) => n[c] === c)) return n
  }
  throw new Error(`no normalisation for ${alg}`)
}
const idx = (p, n) => INDEX.get(key(p, n))
const cornerOf = (x, z) => [[x, -1, z], [[x, 0, 0], [0, -1, 0], [0, 0, z]]]
const edgeOf = (x, z) => [[x, 0, z], [[x, 0, 0], [0, 0, z]]]
const SLOT_DEF = { FR: [1, 1], BR: [1, -1], BL: [-1, -1], FL: [-1, 1] }
const pairStickers = (slot) => {
  const [x, z] = SLOT_DEF[slot]
  const [cp, cn] = cornerOf(x, z)
  const [ep, en] = edgeOf(x, z)
  return { corner: cn.map((n) => idx(cp, n)), edge: en.map((n) => idx(ep, n)) }
}
const pairSolved = (state, slot) => {
  const { corner, edge } = pairStickers(slot)
  return [...corner, ...edge].every((i) => state[i] === i)
}
const locate = (state, id) => SLOTS[state.indexOf(id)]
globalThis.Cube = { SLOTS, SLOT_DEF, compose, invert, parse, perm, pairStickers, pairSolved, locate, identity, idx }
})()
