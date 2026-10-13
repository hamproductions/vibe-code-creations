// Interference engine: picks distractors that are linguistically close to the right answer.
import { toRomaji } from './romaji.js';

// hand-curated confusion families (fan-made suffix variants etc.)
const FAMILIES = [
  ['チャペ', 'アペ', 'カラ', 'キナ', 'ララ', 'トゥスケ', 'ウィスペ', 'ケスィ', 'スゥイスパー', 'ミョーホントゥスケ', 'ミューホントゥスケ', 'ウィースぺ', 'ミョーホン', 'ストライパー'],
  ['タイガー', 'ファイヤー', 'サイバー', 'ファイバー', 'ダイバー', 'バイバー', 'ジャージャー', 'ライガー', 'ファイター', 'サイダー', 'ファイヤ', 'ファイボ', 'ワイパー', 'ファーマー', 'ジャスパー'],
  ['虎', '火', '人造', '繊維', '海女', '振動', '化繊', '飛', '除去', '跳', '海鵜', '舞', '農場'],
  ['Wisupe', 'Kesui', 'Suisupa', 'Myohontusuke'],
  ['ティグレ', 'フェゴ', 'シベル', 'フィブラ', 'ブゾ', 'ビブラル', 'シーレナ', 'ディオサ'],
  ['ティーガァ', 'フォイエル', 'クゥンスト', 'フィーバー', 'タゥツァー', 'シュビングング'],
  ['ティーグレ', 'フォーコ', 'レプリカンテ', 'フィーブラ', 'バロンバーロ', 'ヴィブラメント'],
  ['諸行', '木暮', '時雨', '神楽', '金剛山', '翔襲叉', '黒雲', '無常', '世界混沌'],
  ['高まるよ', '高まる', '低まる', 'ビスマルク', 'シジマール', 'アルシンド', 'カズダンス', 'ニーハイオーハイ', '缶チューハイ', 'ウーロンハイ', 'ナチュラルハイ', 'アイキャンフライ'],
  ['言いたいことがあるんだよ', 'やっぱり○○かわいいよ', '好き好き大好きやっぱ好き', 'やっと見つけたお姫様', '俺が生まれてきた理由', 'それは○○に出会うため', '俺と一緒に人生歩もう', '世界で一番愛してる'],
];
const FAM_INDEX = new Map();
FAMILIES.forEach((f, i) => f.forEach(t => { if (!FAM_INDEX.has(t)) FAM_INDEX.set(t, new Set()); FAM_INDEX.get(t).add(i); }));

export function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export const similarity = (a, b) => { const L = Math.max(a.length, b.length) || 1; return 1 - lev(a, b) / L; };

const script = t => /[一-鿿]/.test(t) ? 'kanji' : /[ァ-ヿ]/.test(t) ? 'kata' : /[ぁ-ゟ]/.test(t) ? 'hira' : 'other';

export function buildVocab(mixes) {
  const vocab = new Map(); // token → {token, ro, mixIds:Set}
  for (const m of mixes) {
    const all = [...m.sequence, ...(m.extension || [])];
    const ro = [...(m.reading || []), ...(m.extReading || [])];
    all.forEach((t, i) => {
      if (t === '👏') return;
      let v = vocab.get(t);
      if (!v) { v = { token: t, ro: (ro[i] || toRomaji(t)).toLowerCase(), mixIds: new Set() }; vocab.set(t, v); }
      v.mixIds.add(m.id);
    });
  }
  return vocab;
}

/** sibling mixes: share ≥ 40% of their tokens with `mix` (variants, extensions, kahen remixes) */
export function siblingTokens(mix, mixes) {
  const mine = new Set([...mix.sequence, ...(mix.extension || [])]);
  const out = new Map();
  for (const o of mixes) {
    if (o.id === mix.id) continue;
    const toks = [...o.sequence, ...(o.extension || [])];
    const shared = toks.filter(t => mine.has(t)).length;
    if (shared / Math.min(toks.length, mine.size) < 0.4) continue;
    toks.forEach(t => { if (!mine.has(t)) out.set(t, (out.get(t) || 0) + 1); });
  }
  return out;
}

/**
 * Returns up to n distractor tokens for `target` in `mix`.
 * exclude: set of token texts that must not appear (e.g. every real token of the sequence in tap-bank mode)
 */
export function distractors({ mix, target, vocab, siblings, n = 3, exclude = new Set(), rng = Math.random, fromOwn = true }) {
  const tro = (vocab.get(target)?.ro || toRomaji(target)).toLowerCase();
  const tfam = FAM_INDEX.get(target) || new Set();
  const tscript = script(target);
  const scored = [];
  for (const [tok, v] of vocab) {
    if (tok === target || exclude.has(tok)) continue;
    if (tok.length > 24 && target.length < 8) continue;
    let s = 2 * similarity(tro, v.ro);
    const f = FAM_INDEX.get(tok);
    if (f) for (const i of f) if (tfam.has(i)) { s += 1.5; break; }
    if (siblings?.has(tok)) s += 2;
    if (script(tok) === tscript) s += 0.6;
    if (Math.abs(tok.length - target.length) <= 1) s += 0.3;
    if (fromOwn && v.mixIds.has(mix.id)) s += 0.5;
    s += rng() * 0.6;
    scored.push([s, tok]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, n).map(x => x[1]);
}
