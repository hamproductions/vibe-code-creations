const { SLOTS, compose, invert, parse, perm, pairStickers, pairSolved, identity, idx } = Cube
const $ = (id) => document.getElementById(id)
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const COLORS = { U: '#f5d90a', D: '#ffffff', F: '#0a9a3c', B: '#1f55e0', R: '#f07a10', L: '#d8232a' }
const PALE = { U: '#f5d90a', D: '#f1f1f1', F: '#86dc9c', B: '#8f8df0', R: '#ffc690', L: '#ff8f8f' }
const ROT = { y: 'BR', y2: 'BL', "y'": 'FL' }
const INV_ROT = { y: "y'", y2: 'y2', "y'": 'y' }
const FP = ["R U R'", "R U' R'", "F' U F", "F' U' F"]
const AUF = ['', 'U', 'U2', "U'"]
const modes = {
  full: { rots: Object.keys(ROT), algs: FP, aufs: AUF },
  two: { rots: ['y'], algs: ["F' U F", "F' U' F"], aufs: ['U', 'U2', "U'"] },
}
const fn = (n) => (n[0] === 1 ? 'R' : n[0] === -1 ? 'L' : n[1] === 1 ? 'U' : n[1] === -1 ? 'D' : n[2] === 1 ? 'F' : 'B')
const posName = (p) => {
  const [x, y, z] = p
  return [y === 1 ? 'U' : y === -1 ? 'D' : '', z === 1 ? 'F' : z === -1 ? 'B' : '', x === 1 ? 'R' : x === -1 ? 'L' : ''].join('')
}
const seq = (rot, a, b) => [rot, a, b, INV_ROT[rot]].filter(Boolean).join(' ')
const permCache = new Map()
const cached = (alg) => {
  if (!permCache.has(alg)) permCache.set(alg, perm(alg))
  return permCache.get(alg)
}
const opts = () => ($('twoGen').checked ? modes.two : modes.full)
const finisher = (state, slot, m = opts()) => {
  const rot = Object.keys(ROT).find((r) => ROT[r] === slot)
  for (const a of m.aufs) for (const f of m.algs) {
    if (pairSolved(compose(state, cached(seq(rot, a, f))), slot)) return `(${[rot, a].filter(Boolean).join(' ')}) ${f}`
  }
  return null
}
const adjust = (alg, auf) => {
  const q = { '': 0, U: 1, U2: 2, "U'": 3 }
  const n = ['', 'U', 'U2', "U'"]
  const m = alg.match(/^\(([^)]*)\)\s*(.*)$/)
  const pre = m ? m[1].split(/\s+/) : []
  const rest = m ? m[2] : alg
  const u = pre.filter((t) => t[0] === 'U').reduce((s, t) => s + q[t], q[auf])
  const rots = pre.filter((t) => t[0] !== 'U')
  const prefix = [...rots, n[u % 4]].filter(Boolean)
  return prefix.length ? `(${prefix.join(' ')}) ${rest}` : rest
}
const rigidZone = (p, pieces) => {
  const cubies = new Map()
  SLOTS.forEach((s, i) => {
    if (s.p[1] === 1 && (s.p[0] || s.p[2])) (cubies.get(s.p.join()) || cubies.set(s.p.join(), []).get(s.p.join())).push(i)
  })
  let best = new Set()
  for (const u of AUF) {
    const net = u ? compose(p, cached(u)) : p
    const set = new Set([...cubies].filter(([, ids]) => ids.every((i) => net[i] === i)).map(([k]) => k))
    if (pieces.every((k) => set.has(k))) return set
    if (set.size > best.size) best = set
  }
  return best
}
const paint = (id, mask, focus) => {
  const s = SLOTS[id]
  const face = fn(s.n)
  if (mask === 'pair') return focus.has(id) ? COLORS[face] : 'var(--hidden)'
  const [x, y, z] = s.p
  if (y === 1 && (x || z)) return 'var(--hidden)'
  if ((x && !y && !z) || (!x && !y && z) || (!x && y && !z)) return COLORS[face]
  if (y === -1 && !(x && z)) return COLORS[face]
  if (x === 1 && z === 1) return COLORS[face]
  return PALE[face]
}
const svgEl = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`
const topMap = (state, { mask = 'trainer', focus = new Set(), zone = null } = {}) => {
  const c = 34
  const cell = (cx, cy, id, ring, tint) => {
    const fill = paint(state[id], mask, focus)
    const stroke = ring ? 'var(--accent)' : 'var(--cubeline)'
    return `<rect x="${cx * c + 2}" y="${cy * c + 2}" width="${c - 4}" height="${c - 4}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${ring ? 3.5 : 1.2}"/>${tint ? `<rect x="${cx * c + 12}" y="${cy * c + 12}" width="${c - 24}" height="${c - 24}" fill="${tint}" stroke="#000" stroke-width=".7"/>` : ''}`
  }
  let out = ''
  for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    const p = [x, 1, z]
    const zoneTint = (zone && (x || z)) ? (zone.has(p.join()) ? '#1b9a55' : '#d0342c') : null
    const home = (i) => focus.has(state[i])
    const uId = idx(p, [0, 1, 0])
    out += cell(x + 2, z + 2, uId, mask === 'trainer' && home(uId), zoneTint)
    if (z === -1) { const i = idx(p, [0, 0, -1]); out += cell(x + 2, 0, i, mask === 'trainer' && home(i)) }
    if (z === 1) { const i = idx(p, [0, 0, 1]); out += cell(x + 2, 4, i, mask === 'trainer' && home(i)) }
    if (x === -1) { const i = idx(p, [-1, 0, 0]); out += cell(0, z + 2, i, mask === 'trainer' && home(i)) }
    if (x === 1) { const i = idx(p, [1, 0, 0]); out += cell(4, z + 2, i, mask === 'trainer' && home(i)) }
  }
  return svgEl(c * 5, c * 5, out, 'Top layer map with side stickers unfolded')
}
const isoView = (state, focus) => {
  const k = 56
  const proj = ([x, y, z]) => [150 + (x - z) * k * 0.866, 175 + (x + z) * k * 0.5 - y * k]
  let out = ''
  SLOTS.forEach((s, i) => {
    const f = fn(s.n)
    if (!['U', 'F', 'R'].includes(f)) return
    const c = s.p.map((v, a) => v + s.n[a] / 2)
    const t = f === 'U' ? [[1, 0, 0], [0, 0, 1]] : f === 'F' ? [[1, 0, 0], [0, 1, 0]] : [[0, 0, 1], [0, 1, 0]]
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj(c.map((v, j) => v + (a * t[0][j] + b * t[1][j]) * 0.47)))
    const ring = focus.has(state[i])
    out += `<polygon points="${pts.map((p) => p.join()).join(' ')}" fill="${paint(state[i], 'trainer', focus)}" stroke="${ring ? 'var(--accent)' : 'var(--cubeline)'}" stroke-width="${ring ? 3.5 : 2}" stroke-linejoin="round"/>`
  })
  return svgEl(300, 350, out, 'Cube view showing top, front and right faces')
}

const SHAPES = [
  ['Joined, left', "R U' R'", 'Edge at front, white pointing away from it on the left.'],
  ['Split, back', "R U R'", 'Corner over the slot with white right, edge at back.'],
  ['Joined, right', "F' U F", 'Mirror: edge on the right, white toward the back.'],
  ['Split, left', "F' U' F", 'Corner over the slot with white front, edge at left.'],
]
const drawShapes = () => {
  const { corner, edge } = pairStickers('FR')
  const focus = new Set([...corner, ...edge])
  $('shapes').innerHTML = SHAPES.map(([name, alg, note]) => {
    const st = invert(perm(alg))
    return `<div class="shape"><h3>${name}: <span class="alg">${alg}</span></h3>${topMap(st, { mask: 'pair', focus })}<p class="small muted">${note}</p></div>`
  }).join('')
}

const game = { cur: null, answered: false, right: 0, total: 0, step: null, timer: null }
const pairFocus = (slot) => { const { corner, edge } = pairStickers(slot); return new Set([...corner, ...edge]) }
const buildCase = () => {
  const m = opts()
  const sel = $('caseSel').value
  const rows = CASES.filter((c) => c.algs.length > 1 && (sel === 'all' || c.name === sel))
  for (let t = 0; t < 400; t++) {
    const row = pick(rows)
    const i = Math.floor(Math.random() * row.algs.length)
    const rot = pick(m.rots)
    const setup = cached(seq(rot, pick(m.algs), pick(m.aufs)))
    const auf = pick(AUF)
    const pre = auf === '' ? '' : auf === 'U' ? "U'" : auf === "U'" ? 'U' : 'U2'
    const slot = ROT[rot]
    let state = compose(setup, invert(cached(row.algs[i])))
    if (auf) state = compose(state, cached(auf))
    const shown = row.algs.map((a) => adjust(a, pre))
    const correct = shown.map((a) => finisher(compose(state, cached(a)), slot) !== null)
    if (correct.every(Boolean) || !correct[i]) continue
    return { row, slot, state, shown, correct, focus: pairFocus(slot) }
  }
  return null
}
const renderBoard = (state) => {
  const c = game.cur
  const focus = c && $('hint').checked ? c.focus : new Set()
  $('iso').innerHTML = isoView(state, focus)
  const pairAt = c ? [...Object.values(pairStickers(c.slot))].map(([id]) => SLOTS[state.indexOf(id)].p.join()) : []
  const zone = c && game.zoneAlg != null && !(game.step?.at > 0) ? rigidZone(cached(c.shown[game.zoneAlg]), pairAt) : null
  $('top').innerHTML = topMap(state, { focus, zone })
  const { corner, edge } = c ? pairStickers(c.slot) : { corner: [], edge: [] }
  if (!c) { $('where').textContent = ''; return }
  const at = (id) => posName(SLOTS[state.indexOf(id)].p)
  $('where').textContent = $('hint').checked ? `Target ${c.slot} pair: corner at ${at(corner[0])}, edge at ${at(edge[0])}.` : ''
}
const renderAlgs = () => {
  const c = game.cur
  $('algs').innerHTML = c.shown.map((a, i) => {
    const cls = game.answered ? (c.correct[i] ? 'right' : 'wrong') : ''
    const replay = game.answered ? `<button class="replay" type="button" data-replay="${i}">Replay</button>` : ''
    return `<div class="algrow"><button class="pick ${cls}" type="button" data-pick="${i}"><b>${i + 1}</b>${a}</button>${replay}</div>`
  }).join('')
}
const nextCase = () => {
  stopPlay()
  game.cur = buildCase()
  game.answered = false
  game.step = null
  game.zoneAlg = null
  $('stepper').hidden = true
  $('verdict').textContent = ''
  $('verdict').className = 'verdict'
  if (!game.cur) {
    $('status').textContent = 'This case has no position where only some algs work with these settings. Pick another case or turn 2gen off.'
    $('algs').innerHTML = ''
    renderBoard(identity())
    return
  }
  $('status').textContent = `${game.cur.row.name}. Pick an alg that leaves a free pair.`
  renderAlgs()
  renderBoard(game.cur.state)
}
const answer = (i) => {
  const c = game.cur
  if (!c || game.answered || i >= c.shown.length) return
  game.answered = true
  game.total++
  const ok = c.correct[i]
  if (ok) game.right++
  $('score').textContent = `${game.right}/${game.total} = ${((game.right / game.total) * 100).toFixed(1)}%`
  const n = c.correct.filter(Boolean).length
  $('verdict').textContent = `${ok ? 'Correct.' : 'Wrong.'} ${n} of ${c.shown.length} algs work here, target slot ${c.slot}.`
  $('verdict').className = `verdict ${ok ? 'ok' : 'no'}`
  renderAlgs()
  openReplay(i)
}
const touches = (states, i, ids) => ids.some((id) => states[i].indexOf(id) !== states[i + 1].indexOf(id))
const openReplay = (i) => {
  stopPlay()
  const c = game.cur
  const tokens = parse(c.shown[i])
  const states = [c.state]
  tokens.forEach((_, k) => states.push(compose(c.state, cached(tokens.slice(0, k + 1).join(' ')))))
  const { corner, edge } = pairStickers(c.slot)
  game.step = { i, tokens, states, at: 0, moved: tokens.map((_, k) => touches(states, k, [corner[0], edge[0]])) }
  $('stepper').hidden = false
  $('stepTitle').textContent = `Replay ${i + 1}`
  showStep()
}
const showStep = () => {
  const s = game.step
  $('tokens').innerHTML = s.tokens.map((t, k) => `<span class="${k === s.at - 1 ? 'cur' : ''} ${s.moved[k] ? 'touch' : ''}">${t}</span>`).join('')
  renderBoard(s.states[s.at])
  $('prev').disabled = s.at === 0
  $('fwd').disabled = s.at === s.tokens.length
  const done = s.at === s.tokens.length
  const fin = done ? finisher(s.states[s.at], game.cur.slot) : null
  const outside = done && !fin ? finisher(s.states[s.at], game.cur.slot, modes.full) : null
  const miss = outside ? `Free in normal mode with ${outside}, but 2gen rejects that finish, so this counts as wrong.` : 'Pair is not free after this alg.'
  $('stepResult').textContent = done ? (fin ? `Pair is free. Finish with ${fin}.` : miss) : `Underlined moves touch the pair: ${s.moved.filter(Boolean).length} of ${s.tokens.length}.`
}
const stopPlay = () => {
  clearInterval(game.timer)
  game.timer = null
  $('play').textContent = 'Play'
}
const init = () => {
  $('caseSel').innerHTML = `<option value="F2L01">F2L01</option><option value="all">All cases</option>${CASES.filter((c) => c.name !== 'F2L01').map((c) => `<option>${c.name}</option>`).join('')}`
  drawShapes()
  $('best').innerHTML = CASES.map((c) => {
    const b = c.pct.indexOf(Math.max(...c.pct))
    return `<tr><td>${c.name}</td><td class="alg">${c.algs[b]}</td><td class="num">${c.pct[b]}%</td><td class="num">${c.algs.length}</td></tr>`
  }).join('')
  $('next').onclick = nextCase
  $('caseSel').onchange = nextCase
  $('twoGen').onchange = nextCase
  $('hint').onchange = () => game.cur && renderBoard(game.step ? game.step.states[game.step.at] : game.cur.state)
  $('zones').onchange = () => {
    game.zoneAlg = null
    if (game.cur) renderBoard(game.step ? game.step.states[game.step.at] : game.cur.state)
  }
  $('algs').addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]')
    const r = e.target.closest('[data-replay]')
    if (r) openReplay(+r.dataset.replay)
    else if (p) answer(+p.dataset.pick)
  })
  const zoneOn = (e) => {
    const p = e.target.closest('[data-pick]')
    if (!p || !$('zones').checked || !game.cur) return
    game.zoneAlg = +p.dataset.pick
    renderBoard(game.step ? game.step.states[game.step.at] : game.cur.state)
  }
  $('algs').addEventListener('mouseover', zoneOn)
  $('algs').addEventListener('focusin', zoneOn)
  $('prev').onclick = () => { stopPlay(); game.step.at--; showStep() }
  $('fwd').onclick = () => { stopPlay(); game.step.at++; showStep() }
  $('play').onclick = () => {
    if (game.timer) return stopPlay()
    if (game.step.at === game.step.tokens.length) game.step.at = 0
    $('play').textContent = 'Pause'
    game.timer = setInterval(() => {
      if (game.step.at >= game.step.tokens.length) return stopPlay()
      game.step.at++
      showStep()
    }, 650)
  }
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT') return
    if (/^[1-9]$/.test(e.key)) answer(+e.key - 1)
    if (e.code === 'Space' && !['BUTTON', 'INPUT'].includes(e.target.tagName)) { e.preventDefault(); nextCase() }
  })
  $('theme').onclick = () => {
    const root = document.documentElement
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
  }
  nextCase()
}
init()
