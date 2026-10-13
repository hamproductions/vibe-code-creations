// Chant DSL parser: turns a pasted multi-line chant body into tokens + layout.
//   blank line      -> stanza break
//   △               -> stripped (hit marker in source notes)
//   【発動】xxx       -> initiator (call that starts the mix, not part of the sequence)
//   X×N             -> X repeated N times
//   (クラップ)(パン)  -> 👏 token
//   word(よみ)       -> reading hint for the preceding token
//   (⇒...) (←...)   -> note, stripped
//   [倍速]           -> speed annotation (baisoku 2x), stripped
//   trailing [...]  -> optional extension tokens
//   -\n-            -> hyphenated line wrap, joined

const CLAP = '👏';
const norm = s =>
  s
    .replace(/[（]/g, '(').replace(/[）]/g, ')')
    .replace(/[［]/g, '[').replace(/[］]/g, ']')
    .replace(/\r/g, '')
    .replace(/-\s*\n\s*-/g, '')
    .replace(/◯|〇/g, '○');

export function parseBody(text) {
  let s = norm(text);
  const notes = [];
  let initiator = null;
  let baisoku = 0;

  s = s.replace(/【発動】([^\n]*)/g, (_, w) => { initiator = w.trim(); return ''; });
  s = s.replace(/【([^】]*)】([^\n]*)/g, (_, tag, w) => { notes.push(tag + ' ' + w.trim()); return ''; });
  s = s.replace(/\((?:⇒|←)([^)]*)\)/g, (m, n) => { notes.push(m.slice(1, -1)); if (/倍/.test(m)) baisoku = Math.max(baisoku, /倍倍/.test(m) ? 4 : 2); return ''; });
  s = s.replace(/\[倍速\]/g, () => { baisoku = Math.max(baisoku, 2); return ''; });
  s = s.replace(/\((?:クラップ|パン|👏)\)/g, ' ' + CLAP + ' ').replace(/👏/g, ' ' + CLAP + ' ');
  s = s.replace(/△/g, ' ');

  const rows = []; // {toks:[{t,r?}], ext:bool}
  let cur = [];
  let inExt = false;
  const flush = () => { if (cur.length) rows.push(cur); cur = []; };
  const lines = s.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flush(); rows.push(null); continue; }
    // split into chunks, tracking brackets
    let buf = '';
    const chunks = []; // {text, ext}
    for (const ch of line) {
      if (ch === '[') { if (buf.trim()) chunks.push({ text: buf, ext: inExt }); buf = ''; inExt = true; }
      else if (ch === ']') { if (buf.trim()) chunks.push({ text: buf, ext: true }); buf = ''; inExt = false; chunks.push({ close: true }); }
      else buf += ch;
    }
    if (buf.trim()) chunks.push({ text: buf, ext: inExt });
    for (const c of chunks) {
      if (c.close) continue;
      for (const w of c.text.trim().split(/\s+/)) {
        if (!w) continue;
        cur.push({ w, ext: c.ext });
      }
    }
    flush();
  }
  flush();

  // expand tokens
  const out = []; // {t, r, ext, row}
  let rowNo = 0;
  let lastRowWasBreak = true;
  for (const row of rows) {
    if (row === null) { if (!lastRowWasBreak) { out.push({ brk: true }); lastRowWasBreak = true; } continue; }
    lastRowWasBreak = false;
    for (const { w, ext } of row) {
      let t = w;
      let reading;
      const rm = t.match(/^(.+?)\(([ぁ-ゟァ-ヿー]+)\)$/);
      if (rm) { t = rm[1]; reading = rm[2]; }
      let n = 1;
      const xm = t.match(/^(.+?)×(\d+)$/);
      if (xm) { t = xm[1]; n = +xm[2]; }
      // standalone ()-leftovers
      t = t.replace(/[()]/g, '');
      if (!t) continue;
      for (let i = 0; i < n; i++) out.push({ t, r: reading, ext, row: rowNo });
    }
    out.push({ rowEnd: true });
    rowNo++;
  }

  // everything after the last non-extension token that is flagged ext → extension;
  // bracket groups before the last body token are kept as ordinary tokens
  const toks = out.filter(o => o.t !== undefined);
  let lastBody = -1;
  toks.forEach((t, i) => { if (!t.ext) lastBody = i; });
  toks.forEach((t, i) => { if (i < lastBody) t.ext = false; });

  const sequence = [], extension = [], readingsHint = {}, extHint = {};
  const layout = [], extLayout = [];
  let bodyCount = 0, extCount = 0, curLayout = layout, curCount = 0, curExt = false;
  const closeRow = () => { if (curCount) { curLayout.push(curCount); curCount = 0; } };
  for (const o of out) {
    if (o.brk) { closeRow(); if (!curExt && layout.length && layout[layout.length - 1] !== 0) curLayout.push(0); continue; }
    if (o.rowEnd) { closeRow(); continue; }
    if (o.ext !== curExt) { closeRow(); curExt = o.ext; curLayout = curExt ? extLayout : layout; }
    if (o.ext) { extension.push(o.t); if (o.r) extHint[extension.length - 1] = o.r; }
    else { sequence.push(o.t); if (o.r) readingsHint[sequence.length - 1] = o.r; }
    curCount++;
  }
  closeRow();
  while (layout.length && layout[layout.length - 1] === 0) layout.pop();

  return { sequence, extension, layout, extLayout, initiator, notes, baisoku, readingsHint, extHint };
}

// text -> header meta + body, for the big seed file
export function parseSeedFile(raw) {
  const entries = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('# ')) {
      if (cur) entries.push(cur);
      cur = { head: line.slice(2), body: [] };
    } else if (cur) cur.body.push(line);
  }
  if (cur) entries.push(cur);
  return entries.map(e => {
    const f = e.head.split('|').map(x => x.trim());
    const [nm, category, timing, trigger, ...rest] = f;
    const flags = rest.join(' ');
    const [en, jp = ''] = nm.split(' / ');
    const body = e.body.filter(l => !l.startsWith('>')).join('\n').trim();
    const comments = e.body.filter(l => l.startsWith('>')).map(l => l.slice(1).trim());
    return { name: en.trim(), jp: jp.trim(), category, timing: +timing, trigger, flags, comments, body };
  });
}
