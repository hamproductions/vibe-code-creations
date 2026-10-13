import { parseBody, parseSeedFile } from './parse.js';
import { SEED_TEXT } from './seedText.js';
import { toRomaji } from './romaji.js';

export const SEED_VERSION = 6;

// Priority tiers: 1 = Essential (learn first), 2 = Common (you'll hear these weekly), 3 = Deep cuts (gags, themes, group originals, rare languages)
// Order here is the recommended learning order and drives the codex + new-card queue.
const TIER1 = ['standard', 'japanese', 'ainu-zenkyou', 'kahen-starter', 'ainu', 'world-chaos', 'kahen-3ren'];
const TIER2 = ['hayashi', 'pan', 'ainu-nichi', 'hogwarts', 'chikipa', 'bismarck', 'ginga', 'gachikoi', 'rascal', 'yoruba', 'spanish-1', 'spanish-3', 'myohon-square', 'tata-3', 'accele',
  'chape-tora', 'jp-torahi', 'konton-gyaku', 'jp-gyaku', 'std-short', 'jp-short', 'pan-short', 'encore', 'itsuikuno', 'enchou', 'gachikoi-short', 'kahen-4ren', 'gachikoi-mix', 'german'];
// Community popularity (blog access ranking, 24h → 1y): these are the mixes people actually look up
const TRENDING = ['accele', 'konton-short', 'world-chaos', 'kahen-3ren', 'spanish-1', 'spanish-3', 'bismarck', 'myohon-square', 'hogwarts', 'ainu-nichi', 'tata-3', 'pan', 'gachikoi', 'hindi-accele', 'thomas', 'suirenka', 'ginga', 'rascal', 'yoruba', 'yoruba-gachikoi', 'ginga-italian', 'rascal-gachikoi', 'rascal-ultimate'];
export const TIER_LABEL = { 1: 'Essential', 2: 'Common', 3: 'Deep Cuts' };

// deterministic UUID (v4-shaped) from a slug so ids stay stable across reseeds
export function uuidFrom(str) {
  let h = [0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h[0] = Math.imul(h[0] ^ c, 597399067); h[1] = Math.imul(h[1] ^ c, 2869860233);
    h[2] = Math.imul(h[2] ^ c, 951274213); h[3] = Math.imul(h[3] ^ c, 2716044179);
  }
  h[0] = Math.imul(h[2] ^ (h[0] >>> 18), 597399067); h[1] = Math.imul(h[3] ^ (h[1] >>> 22), 2869860233);
  h[2] = Math.imul(h[0] ^ (h[2] >>> 17), 951274213); h[3] = Math.imul(h[1] ^ (h[3] >>> 19), 2716044179);
  const x = h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
  const v = '89ab'[parseInt(x[16], 16) & 3];
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-${v}${x.slice(17, 20)}-${x.slice(20, 32)}`;
}

// "jp|romaji" pairs for the verified core set (spec spellings)
const P = s => s.split(',').map(x => x.trim()).map(x => { const [jp, ro] = x.split('|'); return { jp, ro }; });

const CORE = [
  {
    slug: 'standard', name: 'Standard MIX', jp: 'スタンダードMIX', category: 'Basic', timing: 8,
    trigger_context: 'First Instrumental Intro', initiator: 'Aa, yossha ikuzo!', initiatorJp: 'あー、よっしゃ行くぞ！',
    seq: P('タイガー|Tiger,ファイヤー|Fire,サイバー|Cyber,ファイバー|Fiber,ダイバー|Diver,バイバー|Viber,ジャージャー|Jaa Jaa'),
    ext: P('ファイボ|Faibo,ワイパー|Waipa'), extTiming: 10,
    layout: [2, 2, 2, 1], extLayout: [2],
    notes: ['Used at the start of a song. The Faibo, Waipa tail stretches it to 10 bars.'],
  },
  {
    slug: 'japanese', name: 'Japanese MIX', jp: '日本語MIX', category: 'Basic', timing: 8,
    trigger_context: 'Second Interlude (before verse 2)', initiator: 'Aa, mou iccho ikuzo!', initiatorJp: 'あー、もういっちょ行くぞ！',
    seq: P('虎|Tora,火|Hi,人造|Jinzou,繊維|Seni,海女|Ama,振動|Shindou,化繊|Kasen,飛|Tobi,除去|Jokyo'),
    layout: [2, 2, 2, 3], notes: ['Optional tail 飛 除去 is already part of this sequence; the 9-word form is the full version.'],
  },
  {
    slug: 'ainu', name: 'Ainu MIX (Honke)', jp: 'アイヌ語MIX（本家）', category: 'Basic', timing: 8,
    trigger_context: 'Outro (Ending)', initiator: 'Aa, sha ikuzo!', initiatorJp: 'あー、しゃー行くぞ！',
    seq: P('チャペ|Chape,アペ|Ape,カラ|Kara,キナ|Kina,ララ|Rara,トゥスケ|Tusuke,ウィスペ|Wisupe,ケスィ|Kesui,スゥイスパー|Suisupa'),
    layout: [2, 2, 2, 3], notes: ['The "original" Ainu MIX used to close songs. The Wisupe, Kesui, Suisupa fan suffix replaces Myohontusuke.'],
  },
  {
    slug: 'ainu-zenkyou', name: 'Ainu MIX (Zenkyou / Myohon)', jp: 'アイヌ語MIX（全叫・ミョーホン）', category: 'Basic', timing: 8,
    trigger_context: 'Outro / after Japanese MIX / third intro', initiator: 'Aa, sha ikuzo!', initiatorJp: 'あー、しゃー行くぞ！',
    seq: P('チャペ|Chape,アペ|Ape,カラ|Kara,キナ|Kina,ララ|Rara,トゥスケ|Tusuke,ミョーホントゥスケ|Myohontusuke'),
    layout: [2, 2, 2, 1], notes: ['The short Ainu MIX everyone learns first (3rd of the standard 3-ren).'],
  },
  {
    slug: 'kahen-3ren', name: 'Variable 3-Ren (Kahen) MIX', jp: '可変3連MIX', category: 'Advanced', timing: 16,
    trigger_context: 'Bridge / long interlude', baisoku: 2,
    seq: P('人造|Jinzou,ファイヤ|Faiya,ファイボ|Faibo,ワイパー|Waipa,' +
      'タイガー|Taiga,タイガー|Taiga,タタタタタイガー|Tatatata,タイガー|Taiga,' +
      'チャペ|Chape,アペ|Ape,カラ|Kara,キナ|Kina,チャペ|Chape,アペ|Ape,カラ|Kara,キナ|Kina,' +
      'ミョーホントゥスケ|Myohontusuke,ワイパー|Waipa,' +
      'ファイヤー|Faiya,ファイヤー|Faiya,虎|Tora,虎|Tora,カラ|Kara,キナ|Kina,' +
      'チャペ|Chape,アペ|Ape,ファーマー|Faama,海女|Ama,海女|Ama,ジャスパー|Jasupa,' +
      '虎|Tora,タイガー|Taiga,虎|Tora,タイガー|Taiga,人造|Jinzou,繊維|Seni,イエッタイガー|Ie-Taiga'),
    layout: [4, 0, 4, 0, 8, 0, 2, 0, 6, 0, 6, 0, 7],
    notes: ['The hardest mainstream MIX: three languages braided together. Pairs well with the "Kahen 3-Ren wo Oboeru Uta".'],
  },
  {
    slug: 'world-chaos', name: 'World Chaos (Konton) MIX', jp: '混沌MIX（ワールドカオス）', category: 'Advanced', timing: 8,
    trigger_context: 'Heavy metal or electronic drop · Ochisabi', initiator: 'World Chaos!',
    seq: P('ワ|Wa,ワ|Wa,ワ|Wa,ワ|Wa,ワ|Wa,ワ|Wa,ワールドカオス|World Chaos,諸行|Shogyou,木暮|Kogure,時雨|Shigure,神楽|Kagura,金剛山|Kongousan,翔襲叉|Shoushuusha,黒雲|Kokuun,無常|Mujou,世界混沌|Sekai Konton'),
    layout: [6, 1, 2, 2, 2, 3],
    notes: ['After 翔襲叉 the full-size version continues; a gyaku-uchi (reverse) version returns from 翔襲叉.'],
  },
  {
    slug: 'gachikoi', name: 'Gachi Koi Koujou (Real Love Declaration)', jp: 'ガチ恋口上', category: 'Koujou', timing: 16,
    trigger_context: 'Extended Outro / Emotional Interlude',
    seq: P('言いたいことがあるんだよ|Iitai koto ga arundayo,やっぱり○○かわいいよ|Yappari [Name] wa kawaii yo,好き好き大好きやっぱ好き|Suki suki daisuki yappa suki,やっと見つけたお姫様|Yatto mitsuketa ohimesama,' +
      '俺が生まれてきた理由|Ore ga umarete kita riyuu,それは○○に出会うため|Sore wa [Name] ni deau tame,俺と一緒に人生歩もう|Ore to issho ni jinsei ayumou,世界で一番愛してる|Sekai de ichiban aishiteru,あ・い・し・て・る|A-I-SHI-TE-RU'),
    layout: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    notes: ['Replace ○○ with your oshi (set the name in Settings). Fans often shout 「なになにー？」 between lines and 「絶対結婚しようなー！」 at the end.'],
  },
  {
    slug: 'bismarck', name: 'Bismarck Koujou', jp: 'ビスマルク口上', category: 'Koujou', timing: 8,
    trigger_context: '2nd Verse / A-Melody',
    seq: P('高まるよ|Takamaru yo,高まるよ|Takamaru yo,高まる|Takamaru,低まる|Hikumaru,ビスマルク|Bisumaruku,シジマール|Shijimaaru,アルシンド|Arushindo,カズダンス|Kazudansu,' +
      'ニーハイオーハイ|Niihai Oohai,缶チューハイ|Kan Chuuhai,ウーロンハイ|Uuronhai,ナチュラルハイ|Nachuraruhai,アイキャンフライ|Ai Kyan Furai'),
    layout: [3, 2, 0, 3, 0, 1, 1, 1, 1, 1],
    notes: ['Also called the "I Can Fly call". Sung over the verse-2 A-melody.'],
  },
];

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function fromCore(c) {
  const seq = c.seq.map(x => x.jp);
  const reading = c.seq.map(x => x.ro);
  return {
    id: uuidFrom('mixdex:' + c.slug), slug: c.slug, name: c.name, jp: c.jp, category: c.category, timing: c.timing,
    sequence: seq, reading, layout: c.layout,
    extension: (c.ext || []).map(x => x.jp), extReading: (c.ext || []).map(x => x.ro), extLayout: c.extLayout || [], extTiming: c.extTiming || 0,
    trigger_context: c.trigger_context, initiator: c.initiator || '', initiatorJp: c.initiatorJp || '', baisoku: c.baisoku || 0,
    notes: c.notes || [], source: 'seed', core: true,
  };
}

export function entryToMix(e, opts = {}) {
  return fromText(e, opts);
}

function fromText(e, opts = {}) {
  const p = parseBody(e.body);
  const flags = Object.fromEntries(e.flags.split(/\s+/).filter(Boolean).map(f => f.includes('=') ? f.split('=') : [f, true]));
  let slug = flags.id || slugify(e.name) || 'mix-' + Math.random().toString(36).slice(2, 7);
  if (opts.source === 'custom') slug = (opts.reserved?.has(slug) ? 'my-' : '') + slug;
  const bais = flags.b4 ? 4 : flags.b2 ? 2 : p.baisoku;
  const rd = (toks, hint) => toks.map((t, i) => (hint[i] ? toRomaji(hint[i]) : toRomaji(t)));
  return {
    id: uuidFrom((opts.source === 'custom' ? 'custom:' : 'mixdex:') + slug), slug, name: e.name, jp: e.jp, category: e.category, timing: e.timing,
    sequence: p.sequence, reading: rd(p.sequence, p.readingsHint), layout: p.layout,
    extension: p.extension, extReading: rd(p.extension, p.extHint), extLayout: p.extLayout, extTiming: 0,
    trigger_context: e.trigger, initiator: p.initiator ? toRomaji(p.initiator) : '', initiatorJp: p.initiator || '',
    baisoku: bais, notes: [...e.comments, ...p.notes], source: opts.source || 'seed', core: false,
  };
}

export function buildSeed() {
  const list = [...CORE.map(fromCore), ...parseSeedFile(SEED_TEXT).map(fromText)];
  const seen = new Set();
  const rank = new Map([...TIER1, ...TIER2].map((s, i) => [s, i]));
  for (const k of rank.keys()) if (!list.some(m => m.slug === k)) throw new Error('unknown tier slug ' + k);
  list.forEach((m, i) => { m.trending = TRENDING.includes(m.slug); m.tier = TIER1.includes(m.slug) ? 1 : TIER2.includes(m.slug) ? 2 : 3; m._i = i; });
  list.sort((a, b) => a.tier - b.tier || (rank.has(a.slug) ? rank.get(a.slug) : 1e3 + a._i) - (rank.has(b.slug) ? rank.get(b.slug) : 1e3 + b._i));
  list.forEach((m, i) => {
    delete m._i;
    if (seen.has(m.slug)) throw new Error('duplicate slug ' + m.slug);
    seen.add(m.slug);
    m.order = i;
    if (m.reading.length !== m.sequence.length) throw new Error('reading mismatch ' + m.slug);
  });
  return list;
}

export const LEVELS = ['beginner', 'regular', 'veteran', 'master'];

/** slugs a fan of each level is assumed to already know (users can edit this in onboarding) */
export function knownSlugs(level, mixes) {
  const ordered = mixes.filter(m => m.source === 'seed').sort((a, b) => a.order - b.order);
  const t1 = ordered.filter(m => m.tier === 1).map(m => m.slug), t2 = ordered.filter(m => m.tier === 2).map(m => m.slug);
  if (level === 'regular') return ['standard', 'japanese', 'ainu-zenkyou'];
  if (level === 'veteran') return [...t1, ...t2.slice(0, 8)];
  if (level === 'master') return [...t1, ...t2];
  return [];
}
export const LEVEL_SETTINGS = {
  beginner: { newPerDay: 3, mode: 'bank', speed: 'off', bpm: 90, includeExt: false },
  regular: { newPerDay: 5, mode: 'mixed', speed: 'off', bpm: 100, includeExt: false },
  veteran: { newPerDay: 8, mode: 'mixed', speed: 'auto', bpm: 120, includeExt: true },
  master: { newPerDay: 12, mode: 'rhythm', speed: 'auto', bpm: 140, includeExt: true },
};
/** what to learn next for a level: first few not-yet-known mixes (masters get the spicy ones) */
export function nextUp(level, mixes, knownIds, n = 5) {
  let c = mixes.filter(m => !knownIds.has(m.id));
  if (level === 'master') c = c.sort((a, b) => (b.trending - a.trending) || ((b.baisoku || 0) - (a.baisoku || 0)) || (b.category === 'Advanced') - (a.category === 'Advanced') || a.order - b.order);
  return c.slice(0, n);
}

/** serialise a mix back into the seed text DSL (for bulk editing) */
export function mixToText(m, rowsOf) {
  const flags = [`id=${m.slug}`, m.baisoku ? 'b' + m.baisoku : ''].filter(Boolean).join(' | ');
  const head = `# ${m.name}${m.jp ? ' / ' + m.jp : ''} | ${m.category} | ${m.timing} | ${m.trigger_context || '—'} | ${flags}`;
  const stanzas = (toks, layout) => rowsOf(toks.length, layout).map(st => st.map(r => r.map(i => toks[i]).join(' ')).join('\n'));
  const out = [head, ...(m.notes || []).map(n => '> ' + n)];
  if (m.initiatorJp) out.push('【発動】' + m.initiatorJp);
  out.push(stanzas(m.sequence, m.layout).join('\n\n'));
  if (m.extension?.length) out.push(...rowsOf(m.extension.length, m.extLayout).flat().map(r => '[' + r.map(i => m.extension[i]).join(' ') + ']'));
  return out.join('\n');
}
