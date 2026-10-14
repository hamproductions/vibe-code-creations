import { parseBody, parseSeedFile } from './parse.js';
import { SEED_TEXT } from './seedText.js';
import { toRomaji } from './romaji.js';

export const SEED_VERSION = 49;

// Priority tiers: 1 = Essential, 2 = Extended catalog, 3 = Deep cuts
// Order here is the recommended learning order and drives the codex + new-card queue.
const TIER1 = ['standard', 'japanese', 'ainu-zenkyou'];
const TIER2 = ['ainu', 'world-chaos', 'kahen-3ren', 'kahen-starter', 'pan', 'ainu-nichi', 'hogwarts', 'chikipa', 'bismarck', 'ginga', 'gachikoi', 'rascal', 'yoruba', 'spanish-1', 'spanish-3', 'myohon-square', 'tata-3', 'accele',
  'chape-tora', 'jp-torahi', 'konton-reverse', 'konton-gyaku', 'jp-gyaku', 'jp-short', 'pan-short', 'encore', 'itsuikuno', 'enchou', 'gachikoi-short', 'kahen-4ren', 'gachikoi-mix', 'german'];
const FAMILIES = [
  ['standard', 'standard-10'],
  ['japanese', 'japanese-10', 'jp-short', 'jp-torahi', 'jp-gyaku', 'jp-baisoku', 'jp-3x'],
  ['ainu-zenkyou', 'ainu', 'ainu-baisoku'],
  ['world-chaos', 'world-chaos-10', 'konton-short', 'konton-reverse', 'konton-gyaku', 'ashura-konton'],
  ['kahen-3ren', 'kahen-4ren', 'kahen-2', 'tsubasa', 'ultimate'],
  ['myohon-square', 'kahen-starter'],
  ['pan', 'pan-short', 'pan-2'],
  ['yoruba', 'yoruba-2', 'yoruba-3', 'yoruba-gachikoi'],
  ['spanish-1', 'spanish-3'],
  ['german', 'german-ura', 'german-3'],
  ['italian', 'italian-ura', 'italian-3'],
  ['ginga', 'ginga-italian'],
  ['rascal', 'rascal-gachikoi', 'rascal-ultimate'],
  ['tata-3', 'tata-3-full'],
  ['chikipa', 'chikipa-latolata', 'chikipa-sagozo', 'chikipa-3ren', 'chikipa-perfect', 'chikipa-kahen'],
  ['gachikoi', 'gachikoi-short', 'gachikoi-shin', 'gachikoi-kahen', 'gachikoi-mane', 'gachikoi-mix'],
  ['deastage', 'deastage-en'],
  ['mikeneko', 'mikeneko-rebuild'],
  ['thomas', 'thomas-james'],
  ['tanbo', 'koshihikari', 'yousuiro'],
];

const REFERENCES = [
  { slugs: ['jp-short', 'ainu-sun', 'ainu-rain', 'enchou', 'musashi', 'kurofuku', 'spanish-1', 'spanish-3', 'german', 'german-ura', 'german-3', 'italian', 'italian-ura', 'italian-3', 'korean', 'thai', 'arabic', 'russian', 'vietnamese', 'chinese', 'favoria', 'takemin', 'shikou', 'myohon-square', 'myohon-driver', 'kahen-orig', 'kahen-4ren', 'kahen-2', 'ainu-nichi', 'tsubasa', 'hogwarts', 'ultimate', 'jp-3x', 'kahen-unnamed', 'kahen-mange', 'kahen-favoria', 'jp-baisoku', 'ainu-baisoku', 'blend', 'karan', 'hanabi', 'shichifuku', 'tales', 'gokui', 'konton-short', 'ashura-konton', 'tata-3', 'tata-3-full', 'chikipa', 'deastage', 'deastage-en', 'sakuma', 'nanaland', 'moucarry', 'kishoten', 'god', 'kuji', 'itsuikuno', 'yoshiikuzo', 'morimitsuko', 'encore', 'zettai', 'pan', 'pan-2', 'bunmeido', 'excalibur', 'pegasus', 'magic', 'burning', 'gundam', 'men', 'pizza', 'mermaid', 'accele', 'eto', 'seiza', 'douyou', 'sankaku', 'gachikoi', 'gachikoi-short', 'gachikoi-shin', 'gachikoi-kahen', 'sakura-namiki', 'gachikoi-mane', 'manekecha-kimi', 'manekecha-kimiwazurai', 'iroha', 'gachikoi-mix', 'gorgeous', 'mazakon', 'yamiame', 'juritatari', 'banzai', 'camoufla', 'mikeneko', 'mikeneko-rebuild'], title: 'Masakimch: MIX / koujou memo', url: 'http://www.masakimch.be/' },
  { slugs: ['standard', 'japanese', 'ainu', 'ainu-zenkyou', 'kahen-starter'], title: 'Masakimch: MIX / koujou memo', url: 'http://www.masakimch.be/' },
  { slugs: ['standard', 'japanese', 'ainu', 'ainu-zenkyou', 'kahen-3ren', 'world-chaos', 'hogwarts', 'myohon-square', 'kahen-starter', 'ainu-nichi', 'gachikoi', 'bismarck', 'pan-short', 'tsubasa'], title: 'Sho: beginner MIX guide', url: 'https://note.com/sho_20000728/n/nd419f385d988' },
  { slugs: ['gachikoi', 'gachikoi-short', 'gachikoi-shin', 'gachikoi-kahen'], title: 'Onshitsuha: Gachi Koi article', url: 'https://xn--nzwp98desh.com/post/2023/03/24/9801/' },
  { slugs: ['bismarck'], title: 'Masakimch: Takamaru yo', url: 'http://www.masakimch.be/' },
  { slugs: ['bismarck'], title: 'Onshitsuha: Bismarck call', url: 'https://xn--nzwp98desh.com/post/2018/11/07/1601/' },
  { slugs: ['hogwarts'], title: 'Onshitsuha: Hogwarts MIX', url: 'https://xn--nzwp98desh.com/post/2019/06/30/2510/' },
  { slugs: ['accele'], title: 'Onshitsuha: Accele finale Japa Kahen', url: 'https://xn--nzwp98desh.com/post/2020/10/27/4330/' },
  { slugs: ['tanbo', 'koshihikari', 'yousuiro'], title: 'Masakimch: Tanbo no Yousu', url: 'http://www.masakimch.be/' },
  { slugs: ['standard', 'japanese', 'ainu', 'ainu-zenkyou', 'kahen-3ren', 'thomas-james'], title: 'Idol Sengoku Jidai: MIX', url: 'https://seesaawiki.jp/idoljapan2010/d/MIX' },
  { slugs: ['chikipa-latolata', 'chikipa-sagozo', 'chikipa-3ren', 'chikipa-perfect', 'chikipa-kahen'], title: 'Idol Sengoku Jidai: MIX', url: 'https://seesaawiki.jp/idoljapan2010/d/MIX' },
  { slugs: ['world-chaos', 'konton-short', 'konton-reverse', 'konton-gyaku', 'ashura-konton'], title: 'Onshitsuha: Konton MIX and variants', url: 'https://xn--nzwp98desh.com/post/2018/07/17/1098/' },
  { slugs: ['kahen-3ren', 'tsubasa', 'ultimate', 'kahen-2'], title: 'Onshitsuha: variable three-part MIX', url: 'https://xn--nzwp98desh.com/post/2018/08/22/1304/' },
  { slugs: ['spanish-1', 'spanish-3'], title: 'Onshitsuha: Spanish MIX and variants', url: 'https://xn--nzwp98desh.com/post/2018/09/28/1484/' },
  { slugs: ['thomas', 'hindi-accele', 'suirenka'], title: 'Onshitsuha: 2025 MIX roundup', url: 'https://xn--nzwp98desh.com/post/2025/12/31/11895/' },
  { slugs: ['ginga', 'ginga-italian'], title: 'Onshitsuha: Ginga koujou', url: 'https://xn--nzwp98desh.com/post/2025/12/31/11924/' },
  { slugs: ['rascal', 'rascal-gachikoi', 'rascal-ultimate'], title: 'Onshitsuha: Rascal MIX variants', url: 'https://xn--nzwp98desh.com/post/2025/12/31/11897/' },
  { slugs: ['yoruba', 'yoruba-2', 'yoruba-3', 'yoruba-gachikoi'], title: 'Onshitsuha: Yoruba MIX variants', url: 'https://xn--nzwp98desh.com/post/2025/12/31/11903/' },
  { slugs: ['pan-short'], title: 'Idol Sengoku Jidai: Pan MIX', url: 'https://seesaawiki.jp/idoljapan2010/d/MIX' },
  { slugs: ['chape-tora'], title: 'Idol Sengoku Jidai: Fever call', url: 'https://seesaawiki.jp/idoljapan2010/d/MIX' },
  { slugs: ['jp-torahi', 'jp-gyaku'], title: 'Ameba: beginner call and MIX guide', url: 'https://ameblo.jp/archangel-neo/entry-12881375852.html' },
];

const TIMING = { standard: 8, japanese: 8, ainu: 10, 'ainu-zenkyou': 8, 'kahen-starter': 4, 'kahen-3ren': 16, 'world-chaos': 8, 'konton-short': 8, 'konton-reverse': 10, ginga: 12, 'ainu-nichi': 8, tsubasa: 16, hogwarts: 16, bismarck: 12, accele: 16, 'myohon-square': 4, 'pan-short': 8 };
const CONTEXT = {
  standard: 'Often the song intro; follow the song and crowd',
  japanese: 'Often the interlude after the first chorus',
  ainu: 'Often the song outro', 'ainu-zenkyou': 'Often the song outro',
  'kahen-3ren': 'A long instrumental gap; placement depends on the song',
  'world-chaos': 'Often Ochisabi; placement depends on the song',
  'konton-short': 'Often Ochisabi; placement depends on the song',
  'konton-gyaku': 'After the forward Konton MIX',
  'kahen-starter': 'Pre-intro',
  bismarck: 'Often the second A-melody; other placements also occur',
  'myohon-square': 'Often the pre-intro',
};

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
    aliases: ['Standard MIX (Short Ending)', 'スタンダード（短縮）'],
    ext: P('ファイボ|Faibo,ワイパー|Waipa'), extTiming: 10,
    layout: [2, 2, 2, 1], extLayout: [2],
    notes: ['Uses the MCH row grouping and ファイヤー spelling. Sho writes ファイアー and groups the calls into fewer rows. The Faibo, Waipa tail stretches it to 10 bars.'],
  },
  {
    slug: 'japanese', name: 'Japanese MIX', jp: '日本語MIX', category: 'Basic', timing: 8,
    trigger_context: 'Second Interlude (before verse 2)', initiator: 'Aa, mou iccho ikuzo!', initiatorJp: 'あー、もういっちょ行くぞ！',
    seq: P('虎|Tora,火|Hi,人造|Jinzou,繊維|Seni,海女|Ama,振動|Shindou,化繊|Kasen'),
    ext: P('飛|Tobi,除去|Jokyo'), extTiming: 10, extLayout: [2],
    layout: [2, 2, 2, 1], notes: ['The 8-bar form ends at 化繊. Add 飛 除去 for the 10-bar form. A compressed 化繊飛除去 ending is a separate variant.'],
  },
  {
    slug: 'ainu', name: 'Ainu MIX (10-bar / Honke)', jp: 'アイヌ語MIX（10小節・本家）', category: 'Basic', timing: 10,
    trigger_context: 'Outro (Ending)', initiator: 'Aa, sha ikuzo!', initiatorJp: 'あー、しゃー行くぞ！',
    seq: P('チャペ|Chape,アペ|Ape,カラ|Kara,キナ|Kina,ララ|Rara,トゥスケ|Tusuke,ウィスペ|Wisupe,ケスィ|Kesui,スィスゥパー|Suisupa'),
    layout: [2, 2, 2, 2, 1], notes: ['Follows the MCH row breaks: ウィスペ ケスィ and スィスゥパー stay separate after トゥスケ. Sho groups チャペ through キナ on one row and spells the final call スィスパー; the Wiki spells it スィスゥパ. The 8-bar Zenkyou form instead ends with ミョーホントゥスケ.'],
  },
  {
    slug: 'ainu-zenkyou', name: 'Ainu MIX (Zenkyou / Myohon)', jp: 'アイヌ語MIX（全叫・ミョーホン）', category: 'Basic', timing: 8,
    trigger_context: 'Outro / after Japanese MIX / third intro', initiator: 'Aa, sha ikuzo!', initiatorJp: 'あー、しゃー行くぞ！',
    seq: P('チャペ|Chape,アペ|Ape,カラ|Kara,キナ|Kina,ララ|Rara,トゥスケ|Tusuke,ミョーホントゥスケ|Myohontusuke'),
    layout: [2, 2, 2, 1], notes: ['An 8-bar Ainu version, commonly taught alongside Standard and Japanese MIX. Uses MCH row grouping; MCH spells the last call ミューホントゥスケ, while Sho/Wiki use ミョーホントゥスケ. The 10-bar version uses a different ending.'],
  },
  {
    slug: 'kahen-3ren', name: 'Variable 3-Ren (Kahen) MIX', jp: '可変3連MIX', category: 'Advanced', timing: 16,
    trigger_context: 'Bridge / long interlude',
    seq: P('人造ファイヤファイボワイパー|Jinzou Faiya Faibo Waipa,' +
      'タイガータイガータタタタタイガー|Taiga Taiga Tatatatataiga,' +
      'チャペアペカラキナ|Chape Ape Kara Kina,チャペアペカラキナ|Chape Ape Kara Kina,' +
      'ミョーホントゥスケ👏ワイパー|Myohontusuke Clap Waipa,' +
      'ファイヤーファイヤー虎虎カラキナ|Faiya Faiya Tora Tora Kara Kina,' +
      'チャペアペファーマー海女海女ジャスパー|Chape Ape Faama Ama Ama Jasupa,' +
      '虎タイガー|Tora Taiga,虎タイガー|Tora Taiga,人造繊維|Jinzou Seni,イェッタイガー|Ye-Taiga'),
    layout: [1, 1, 2, 1, 1, 1, 2, 2],
    notes: ['A 16-bar MIX combining Standard, Japanese, Ainu, and Enchou phrases. The article/Sho form keeps ミョーホントゥスケ👏ワイパー fused; the Wiki transcription omits the clap and separates more calls. Article/Sho spell イェッタイガー; Wiki/MCH spell イエッタイガー.'],
  },
  {
    slug: 'world-chaos', name: 'World Chaos (Konton) MIX', jp: '混沌MIX（ワールドカオス）', category: 'Advanced', timing: 8,
    trigger_context: 'Often Ochisabi; placement depends on the song',
    seq: P('ワ|Wa,ワ|Wa,ワ|Wa,ワ|Wa,ワ|Wa,ワ|Wa,ワールドカオス|World Chaos,諸行|Shogyou,木暮|Kogure,時雨|Shigure,神楽|Kagura,金剛山|Kongousan,翔襲叉|Shoushuusha'),
    ext: P('黒雲|Kokuun,無常|Mujou,世界混沌|Sekai Konton'), extTiming: 10, extLayout: [3],
    layout: [4, 3, 4, 2],
    notes: ['The six ワ calls lead into ワールドカオス and the complete chant. The 8-bar form ends at 翔襲叉; the 10-bar form adds 黒雲 無常 世界混沌. Gyaku-uchi is a reverse-order variant, including a foldback version after the forward chant.'],
  },
  {
    slug: 'gachikoi', name: 'Gachi Koi Koujou (Real Love Declaration)', jp: 'ガチ恋口上', category: 'Koujou', timing: 0, tokenization: 'phrases',
    trigger_context: '',
    seq: P('言いたいことが|Iitai koto ga,あるんだよ|Arundayo,やっぱり○○|Yappari [Name],かわいいよ|Kawaii yo,' +
      '好き好き大好き|Suki suki daisuki,やっぱ好き|Yappa suki,やっと見つけた|Yatto mitsuketa,お姫様|Ohimesama,' +
      '俺が生まれて|Ore ga umarete,きた理由|Kita riyuu,それはお前に|Sore wa omae ni,出会うため|Deau tame,' +
      '俺と一緒に|Ore to issho ni,人生歩もう|Jinsei ayumou,世界で一番|Sekai de ichiban,愛してる|Aishiteru'),
    ext: P('あ|A,い|I,し|SHI,て|TE,るー|RU'),
    layout: [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1], extLayout: [4, 1],
    notes: ['Replace ○○ with your oshi (set the name in Settings). Fans often shout 「なになにー？」 between lines and 「絶対結婚しようなー！」 at the end.'],
  },
  {
    slug: 'bismarck', name: 'Bismarck Koujou', jp: 'ビスマルク口上', category: 'Koujou', timing: 12, tokenization: 'phrases',
    trigger_context: 'Often the second A-melody; other placements also occur',
    seq: P('高まるよ|Takamaru yo,高まるよ|Takamaru yo,高まる低まる|Takamaru Hikumaru,ビスマルク|Bisumaruku,シジマール|Shijimaaru,アルシンド|Arushindo,カズダンス|Kazudansu,' +
      'ニーハイオーハイ|Niihai Oohai,缶チューハイ|Kan Chuuhai,ウーロンハイ|Uuronhai,ナチュラルハイ|Nachuraruhai,アイキャンフライ|Ai Kyan Furai'),
    layout: [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    notes: ['Often used over the second A-melody, with other placements depending on the song.'],
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
    notes: c.notes || [], aliases: c.aliases || [], source: 'seed', core: true, tokenization: c.tokenization || 'terms',
  };
}

export function entryToMix(e, opts = {}) {
  return fromText(e, opts);
}

function fromText(e, opts = {}) {
  const flags = Object.fromEntries(e.flags.split(/\s+/).filter(Boolean).map(f => f.includes('=') ? f.split('=') : [f, true]));
  const p = parseBody(e.body);
  let slug = flags.id || slugify(e.name) || 'mix-' + Math.random().toString(36).slice(2, 7);
  if (opts.source === 'custom') slug = (opts.reserved?.has(slug) ? 'my-' : '') + slug;
  const bais = flags.b4 ? 4 : flags.b2 ? 2 : p.baisoku;
  const rd = (toks, hint) => toks.map((t, i) => (hint[i] ? toRomaji(hint[i]) : toRomaji(t)));
  return {
    id: uuidFrom((opts.source === 'custom' ? 'custom:' : 'mixdex:') + slug), slug, name: e.name, jp: e.jp, category: e.category, timing: e.timing,
    sequence: p.sequence, reading: rd(p.sequence, p.readingsHint), layout: p.layout,
    extension: p.extension, extReading: rd(p.extension, p.extHint), extLayout: p.extLayout, extTiming: 0,
    trigger_context: e.trigger, initiator: p.initiator ? toRomaji(p.initiator) : '', initiatorJp: p.initiator || '',
    baisoku: bais, notes: [...e.comments, ...p.notes], source: opts.source || 'seed', core: false, tokenization: flags.phrases ? 'phrases' : 'terms', sourcePending: !!flags.pending,
  };
}

export function buildSeed() {
  const list = [...CORE.map(fromCore), ...parseSeedFile(SEED_TEXT).map(fromText)];
  const tanbo = list.find(m => m.slug === 'tanbo');
  for (const slug of ['koshihikari', 'yousuiro']) {
    const excerpt = list.find(m => m.slug === slug);
    tanbo.sequence.push(...excerpt.sequence);
    tanbo.reading.push(...excerpt.reading);
    tanbo.layout.push(0, ...excerpt.layout);
    excerpt.excerptOf = 'tanbo';
  }
  for (const m of list.slice()) {
    if (!m.core || !m.extTiming || !m.extension.length) continue;
    const slug = `${m.slug}-${m.extTiming}`;
    list.push({ ...m, id: uuidFrom('mixdex:' + slug), slug, baseSlug: m.slug,
      name: `${m.name} (${m.extTiming}-bar version)`, jp: `${m.jp}（${m.extTiming}小節版）`, timing: m.extTiming,
      sequence: [...m.sequence, ...m.extension], reading: [...m.reading, ...m.extReading], layout: [...m.layout, ...m.extLayout],
      extension: [], extReading: [], extLayout: [], extTiming: 0,
    });
  }
  const seen = new Set();
  const rank = new Map([...TIER1, ...TIER2].map((s, i) => [s, i]));
  for (const k of rank.keys()) if (!list.some(m => m.slug === k)) throw new Error('unknown tier slug ' + k);
  list.forEach((m, i) => { m.tier = TIER1.includes(m.slug) ? 1 : m.baseSlug || TIER2.includes(m.slug) ? 2 : 3; m._i = i; });
  list.sort((a, b) => a.tier - b.tier || (rank.has(a.slug) ? rank.get(a.slug) : 1e3 + a._i) - (rank.has(b.slug) ? rank.get(b.slug) : 1e3 + b._i));
  list.forEach((m, i) => {
    delete m._i;
    if (seen.has(m.slug)) throw new Error('duplicate slug ' + m.slug);
    seen.add(m.slug);
    m.order = i;
    m.family = FAMILIES.find(f => f.includes(m.slug))?.[0] || m.slug;
    m.references = REFERENCES.filter(r => r.slugs.includes(m.baseSlug || m.slug)).map(({ title, url }) => ({ title, url }));
    m.timing = m.baseSlug ? m.timing : TIMING[m.slug] || 0;
    m.trigger_context = CONTEXT[m.baseSlug || m.slug] || '';
    if (m.slug === 'gachikoi') m.timingOptions = [16, 18];
    if (['hogwarts', 'accele'].includes(m.slug)) m.timingOptions = [16, 18];
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
  let c = mixes.filter(m => !m.excerptOf && !m.sourcePending && !knownIds.has(m.id));
  return c.slice(0, n);
}

/** serialise a mix back into the seed text DSL (for bulk editing) */
export function mixToText(m, rowsOf) {
  const flags = [`id=${m.slug}`, m.baisoku ? 'b' + m.baisoku : '', m.tokenization === 'phrases' ? 'phrases' : '', m.sourcePending ? 'pending' : ''].filter(Boolean).join(' | ');
  const head = `# ${m.name}${m.jp ? ' / ' + m.jp : ''} | ${m.category} | ${m.timing} | ${m.trigger_context || '—'} | ${flags}`;
  const stanzas = (toks, layout) => rowsOf(toks.length, layout).map(st => st.map(r => r.map(i => toks[i]).join(' ')).join('\n'));
  const out = [head, ...(m.notes || []).map(n => '> ' + n)];
  if (m.initiatorJp) out.push(...m.initiatorJp.split('\n').map(line => '【発動】' + line));
  out.push(stanzas(m.sequence, m.layout).join('\n\n'));
  if (m.extension?.length) out.push(...rowsOf(m.extension.length, m.extLayout).flat().map(r => '[' + r.map(i => m.extension[i]).join(' ') + ']'));
  return out.join('\n');
}
