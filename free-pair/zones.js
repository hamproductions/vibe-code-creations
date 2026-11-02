const { zoneMap } = ZoneMap
const $ = (id) => document.getElementById(id)
const C = 30
const GRID = C * 5
const centre = ([x, , z]) => [(x + 2.5) * C, (z + 2.5) * C]
const rect = (cx, cy, cls) => `<rect class="${cls}" x="${cx * C + 2}" y="${cy * C + 2}" width="${C - 4}" height="${C - 4}" rx="3"/>`
const FACE_CELL = {
  F: ([x]) => [x + 2, 4],
  B: ([x]) => [x + 2, 0],
  L: ([, , z]) => [0, z + 2],
  R: ([, , z]) => [4, z + 2],
}
const arrow = (from, to) => {
  const [x1, y1] = centre(from), [x2, y2] = centre(to)
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  const ux = dx / len, uy = dy / len
  const bend = Math.min(14, len * 0.3)
  const sx = x1 + ux * 8, sy = y1 + uy * 8, ex = x2 - ux * 10, ey = y2 - uy * 10
  const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend
  const d = `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
  return `<path class="casing" d="${d}"/><path class="route" d="${d}" marker-end="url(#route-head)"/>`
}
const badge = ([x, , z], letter, dx) => {
  const cx = (x + 2) * C + dx, cy = (z + 2) * C + 9
  return `<circle class="badge" cx="${cx}" cy="${cy}" r="6.5"/><text class="badge-text" x="${cx}" y="${cy + 3.5}" text-anchor="middle">${letter}</text>`
}
const diagram = (m) => {
  const strips = []
  for (const v of [-1, 0, 1]) strips.push(rect(v + 2, 0, 'strip'), rect(v + 2, 4, 'strip'), rect(0, v + 2, 'strip'), rect(4, v + 2, 'strip'))
  const tiles = m.tiles.map((t) => rect(t.p[0] + 2, t.p[2] + 2, t.kind)).join('')
  const lit = m.tiles.filter((t) => t.kind !== 'fr' && t.topFace !== 'U').map((t) => {
    const [cx, cy] = FACE_CELL[t.topFace](t.p)
    return rect(cx, cy, 'lit')
  }).join('')
  const routes = m.tiles.filter((t) => t.kind === 'moved' && t.toKey !== t.key).map((t) => arrow(t.p, t.toKey.split(',').map(Number))).join('')
  const exits = [[m.corner, 'C', 9], [m.edge, 'E', 21]].filter(([x]) => x).map(([x, l, dx]) => badge(x.p, l, dx)).join('')
  const held = m.tiles.filter((t) => t.kind === 'still').map((t) => t.name).join(', ')
  return `<svg class="zone" viewBox="0 0 ${GRID} ${GRID}" role="img" aria-label="Touch zone of ${m.core}. Rigid tiles: ${held}">${strips.join('')}${rect(2, 2, 'hub')}${tiles}${lit}${routes}${exits}</svg>`
}
const slotText = (m) => {
  if (!m.corner && !m.edge) return 'Slot pieces stay in the slot.'
  const c = m.corner ? `C to ${m.corner.to}, dead if white on ${m.corner.topFace}` : ''
  const e = m.edge ? `E to ${m.edge.to}, ${m.edge.topFace} sticker lands on top` : ''
  return [c, e].filter(Boolean).join('. ')
}
const card = (alg, big) => {
  const m = zoneMap(alg)
  const turn = m.turn ? `Green turns as ${m.turn}.` : 'Green does not turn.'
  return `<article class="zcard${big ? ' big' : ''}"><h3 class="alg">${alg}</h3>${diagram(m)}<p class="small muted">${turn} ${slotText(m)}.</p></article>`
}
$('featured').innerHTML = ["R U R'", "R U2 R'", "R' F R F'"].map((a) => card(a, true)).join('')
$('legend').innerHTML = card("R U' R'", true)
$('jump').innerHTML = `<option value="">All ${CASES.length} cases</option>${CASES.map((c) => `<option>${c.name}</option>`).join('')}`
$('all').innerHTML = CASES.map((c) => `<section class="zcase" data-case="${c.name}"><h3>${c.name}</h3><div class="zgrid">${c.algs.map((a) => card(a, false)).join('')}</div></section>`).join('')
$('jump').onchange = () => {
  const v = $('jump').value
  document.querySelectorAll('.zcase').forEach((s) => { s.hidden = !!v && s.dataset.case !== v })
}
$('theme').onclick = () => {
  const root = document.documentElement
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  root.dataset.theme = dark ? 'light' : 'dark'
}
