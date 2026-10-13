// Metronome clicks + feedback blips via WebAudio. Everything degrades silently.
let ctx = null;
export function ensureAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
  return ctx;
}
export const audioNow = () => (ctx ? ctx.currentTime : 0);

export function click(at, accent = false, vol = 0.25) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = accent ? 1560 : 1040;
  o.type = 'square';
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  o.connect(g).connect(ctx.destination);
  o.start(at); o.stop(at + 0.06);
}
export function blip(kind) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  const f = { ok: 880, perfect: 1320, wrong: 160, done: 1760 }[kind] || 660;
  o.type = kind === 'wrong' ? 'sawtooth' : 'triangle';
  o.frequency.setValueAtTime(f, t);
  if (kind === 'done') o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.15);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'done' ? 0.3 : 0.12));
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + 0.32);
}
export const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
