// Kana → romaji (loose Hepburn, matching the fan-romanisation style used by MIXDEX)
// plus a dictionary for the kanji words used in chants.
import { KANJI } from './kanjiDict.js';

const BASE = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', ゐ: 'i', ゑ: 'e', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', ゔ: 'vu',
};
const SMALL_Y = { ゃ: 'a', ゅ: 'u', ょ: 'o' };
const COMBO_I = { し: 'sh', ち: 'ch', じ: 'j', ぢ: 'j' };
const SMALL_V = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o' };

const kataToHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

function kanaWord(h) {
  let out = '';
  const chars = [...h];
  let geminate = false;
  let i = 0;
  const units = []; // for trailing long-vowel rule
  while (i < chars.length) {
    const c = chars[i], n = chars[i + 1];
    if (c === 'っ') { geminate = true; i++; continue; }
    if (c === 'ー') {
      const last = out.match(/[aiueo]$/);
      units.push({ lng: true, v: last ? last[0] : '' });
      i++; continue;
    }
    let syl;
    if (n && SMALL_Y[n] && BASE[c] && /[ぃ]/.test('') === false && c !== 'う') {
      const b = BASE[c];
      syl = COMBO_I[c] ? COMBO_I[c] + SMALL_Y[n] : b.slice(0, -1) + 'y' + SMALL_Y[n];
      if (c === 'い') syl = 'y' + SMALL_Y[n];
      i += 2;
    } else if (n && SMALL_V[n] && (BASE[c] || c === 'ゔ')) {
      const v = SMALL_V[n];
      const b = c === 'ゔ' ? 'v' : BASE[c];
      if (c === 'て' || c === 'で') syl = (c === 'て' ? 't' : 'd') + (v === 'i' ? 'i' : v === 'u' ? 'yu' : v);
      else if (c === 'と' || c === 'ど') syl = (c === 'と' ? 't' : 'd') + (v === 'u' ? 'u' : v);
      else if (c === 'ふ') syl = 'f' + v;
      else if (c === 'う') syl = v === 'i' ? 'wi' : v === 'e' ? 'we' : v === 'o' ? 'wo' : 'u';
      else if (c === 'ゔ') syl = 'v' + v;
      else if (c === 'し') syl = 'sh' + (v === 'i' ? 'i' : v);
      else if (c === 'じ') syl = 'j' + v;
      else if (c === 'ち') syl = 'ch' + v;
      else if (c === 'つ') syl = 'ts' + v;
      else if (c === 'す' && v === 'i') syl = 'si';
      else if (c === 'い' && v === 'e') syl = 'ye';
      else if (c === 'く' && v === 'u') syl = 'ku';
      else syl = b.slice(0, -1) + v;
      i += 2;
    } else if (BASE[c] !== undefined) {
      syl = BASE[c]; i++;
    } else if (SMALL_V[c]) { syl = SMALL_V[c]; i++; }
    else if (SMALL_Y[c]) { syl = 'y' + SMALL_Y[c]; i++; }
    else { syl = c; i++; }
    if (geminate) { syl = (/^[a-z]/.test(syl) ? (syl[0] === 'c' ? 't' : syl[0]) : '') + syl; geminate = false; }
    out += syl;
    units.push({ s: syl });
  }
  // long vowels: keep inside the word, drop a final one when 2+ syllables precede (Waipa, Taiga) but keep Jaa, Faama
  let res = '';
  const syls = units.filter(u => !u.lng).length;
  let seen = 0;
  for (let k = 0; k < units.length; k++) {
    const u = units[k];
    if (u.lng) {
      const isFinal = k === units.length - 1;
      if (isFinal && syls >= 2) continue;
      res += u.v;
    } else { res += u.s; seen++; }
  }
  return res;
}

const hasKanji = s => /[一-鿿々]/.test(s);
const isKana = c => /[぀-ヿー]/.test(c);

// token → romaji. Kanji are resolved by longest dictionary match, kana runs are converted.
const KEYS_MAX = Math.max(1, ...Object.keys(KANJI).map(k => k.length));
export function toRomaji(token) {
  if (!token) return token;
  const chars = [...token.replace(/―/g, 'ー')];
  const parts = []; // {t, kj}
  let buf = '';
  const flush = () => { if (buf) { parts.push({ t: kanaWord(kataToHira(buf)), kata: /[ァ-ヿ]/.test(buf) }); buf = ''; } };
  for (let i = 0; i < chars.length;) {
    const c = chars[i];
    let hit = null;
    for (let L = Math.min(KEYS_MAX, chars.length - i); L >= 1; L--) {
      const key = chars.slice(i, i + L).join('');
      if (KANJI[key]) { hit = key; break; }
    }
    if (hit) {
      flush();
      parts.push({ t: kanaWord(kataToHira(KANJI[hit])), kj: true }); i += [...hit].length;
    } else if (hasKanji(c)) {
      flush(); parts.push({ t: c, kj: true, unknown: true }); i++;
    } else if (isKana(c) && c !== '・') { buf += c; i++; }
    else { flush(); parts.push({ t: c === '・' ? '-' : c, raw: true }); i++; }
  }
  flush();
  let out = '';
  parts.forEach((p, k) => {
    const prev = parts[k - 1];
    if (prev && prev.kj && !p.raw && (p.kj || p.kata)) out += ' ';
    out += p.t;
  });
  return out.replace(/　/g, ' ').replace(/？/g, '?').replace(/！/g, '!');
}

export function needsKanjiEntry(token) {
  return /\u003f/.test('') || toRomaji(token).split('').some(ch => /[\u4e00-\u9fff]/.test(ch));
}

// Capitalise for display
export const titleCase = s => s.replace(/(^|[\s-])([a-z])/g, (_, a, b) => a + b.toUpperCase());
