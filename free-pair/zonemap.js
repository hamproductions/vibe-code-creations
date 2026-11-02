(() => {
const { SLOTS, compose, invert, perm, identity } = Cube
const AUF = ['', "U'", 'U2', 'U']
const uPow = AUF.map((a) => (a ? perm(a) : identity()))
const MOVE_NAME = ['', 'U', 'U2', "U'"]
const face = (n) => (n[0] === 1 ? 'R' : n[0] === -1 ? 'L' : n[1] === 1 ? 'U' : n[1] === -1 ? 'D' : n[2] === 1 ? 'F' : 'B')
const posName = ([x, y, z]) => [y === 1 ? 'U' : y === -1 ? 'D' : '', z === 1 ? 'F' : z === -1 ? 'B' : '', x === 1 ? 'R' : x === -1 ? 'L' : ''].join('')
const cubies = new Map()
SLOTS.forEach((s, i) => {
  const k = s.p.join()
  if (!cubies.has(k)) cubies.set(k, [])
  cubies.get(k).push(i)
})
const top = [...cubies].filter(([k, ids]) => k.split(',')[1] === '1' && ids.length > 1)
const coreAlg = (alg) => {
  const m = alg.match(/^\(([^)]*)\)\s*(.*)$/)
  if (!m) return alg
  return [...m[1].split(/\s+/).filter((t) => t[0] !== 'U'), m[2]].join(' ')
}
const landing = (q, ids) => {
  const hits = ids.map((i) => ({ from: SLOTS[i], to: SLOTS[q[i]] }))
  const p = hits[0].to.p
  const up = hits.find((h) => h.to.n[1] === 1)
  return { p, to: posName(p), toKey: p.join(), topFace: up ? face(up.from.n) : null }
}
const zoneMap = (alg) => {
  const core = coreAlg(alg)
  const p = perm(core)
  const sizes = uPow.map((u) => {
    const net = compose(p, u)
    return top.filter(([, ids]) => ids.every((i) => net[i] === i)).length
  })
  const k = sizes.indexOf(Math.max(...sizes))
  const q = invert(compose(p, uPow[k]))
  const tiles = top.map(([key, ids]) => {
    const land = landing(q, ids)
    const still = ids.every((i) => q[i] === i)
    return {
      key,
      p: key.split(',').map(Number),
      name: posName(key.split(',').map(Number)),
      kind: still ? 'still' : land.p[1] === 1 ? 'moved' : 'fr',
      to: land.to,
      toKey: land.toKey,
      topFace: land.topFace,
    }
  })
  const exit = (key) => {
    const land = landing(q, cubies.get(key))
    return land.p[1] === 1 ? land : null
  }
  return { alg, core, turn: MOVE_NAME[k], tiles, corner: exit('1,-1,1'), edge: exit('1,0,1') }
}
globalThis.ZoneMap = { zoneMap, coreAlg, face, posName }
})()
