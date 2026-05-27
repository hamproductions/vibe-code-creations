import { writeFile } from 'node:fs/promises';

const COLPI_CSV_URL = 'https://bestsiteever.net/colpi/api/csv.php';
const COLPI_ANKI_URL = 'https://bestsiteever.net/colpi/api/anki.php';
const SPEEDSOLVING_WIKI_URL = 'https://www.speedsolving.com/wiki/index.php?title=List_of_letter_pairs&action=raw';
const SOURCE_NAMES = ['CoLPI CSV', 'CoLPI Anki', 'Speedsolving Wiki'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat('ʧ');

function cleanTerm(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeTerm(value) {
    return cleanTerm(value)
        .normalize('NFKC')
        .toUpperCase();
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (quoted && next === '"') {
                field += '"';
                i++;
            } else {
                quoted = !quoted;
            }
        } else if (char === ',' && !quoted) {
            row.push(field);
            field = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') i++;
            row.push(field);
            if (row.some((item) => item !== '')) rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }

    row.push(field);
    if (row.some((item) => item !== '')) rows.push(row);
    return rows;
}

function addPairValue(output, pair, term) {
    const clean = cleanTerm(term);
    if (!/^[A-Zʧ]{2}$/.test(pair) || !clean) return;
    output[pair] ||= [];
    output[pair].push(clean);
}

export function parseColpiCsv(text) {
    const rows = parseCsv(text);
    const output = {};
    if (!rows.length) return output;

    if (rows.length > 1) {
        const headers = rows[0].slice(1).map(cleanTerm).filter(Boolean);
        for (const row of rows.slice(1)) {
            const first = cleanTerm(row[0]);
            headers.forEach((letter, index) => addPairValue(output, first + letter, row[index + 1]));
        }
        return output;
    }

    const fields = rows[0].map(cleanTerm);
    const firstHeader = fields[1];
    const firstRowIndex = fields.findIndex((field, index) => index > 1 && field === firstHeader);
    const headers = fields.slice(1, firstRowIndex);
    let index = firstRowIndex;

    while (index < fields.length) {
        const first = fields[index++];
        for (const letter of headers) addPairValue(output, first + letter, fields[index++]);
    }

    return output;
}

function pairMarkerIndex(text, pair, start) {
    const escaped = pair.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(?=\\s)`, 'g');
    regex.lastIndex = start;
    const match = regex.exec(text);
    return match ? match.index + match[1].length : -1;
}

export function parseColpiAnki(text) {
    const output = {};
    const normalized = String(text || '').replace(/\r\n?/g, '\n');
    let cursor = 0;

    for (let i = 0; i < LETTERS.length; i++) {
        for (let j = 0; j < LETTERS.length; j++) {
            const pair = LETTERS[i] + LETTERS[j];
            const marker = pairMarkerIndex(normalized, pair, Math.max(0, cursor - 1));
            if (marker < 0) continue;
            const start = marker + pair.length;
            let end = normalized.length;

            for (let nextI = i, nextJ = j + 1; nextI < LETTERS.length; nextI++, nextJ = 0) {
                for (; nextJ < LETTERS.length; nextJ++) {
                    const nextPair = LETTERS[nextI] + LETTERS[nextJ];
                    const nextMarker = pairMarkerIndex(normalized, nextPair, start);
                    if (nextMarker >= 0) {
                        end = nextMarker;
                        nextI = LETTERS.length;
                        break;
                    }
                }
            }

            normalized.slice(start, end).split(/(?:<br\s*\/?>|\n)/i).forEach((term) => addPairValue(output, pair, term));
            cursor = end;
        }
    }

    return output;
}

function cleanWikiText(value) {
    return cleanTerm(value)
        .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/'''+/g, '')
        .replace(/<[^>]+>/g, '');
}

export function parseSpeedsolvingWiki(text) {
    const output = {};
    let pair = '';

    for (const line of String(text || '').split(/\r?\n/)) {
        const heading = line.match(/^==\s*([A-Z]{2})\s*==$/);
        if (heading) {
            pair = heading[1];
            continue;
        }

        if (!pair) continue;
        const bullet = line.match(/^\*\s*(.+)$/);
        if (bullet) addPairValue(output, pair, cleanWikiText(bullet[1]));
    }

    return output;
}

function mergeEntry(target, sourceName, pair, term) {
    const key = normalizeTerm(term);
    if (!key) return;
    let entry = target[pair].entries.find((item) => item.key === key);
    if (!entry) {
        entry = { term: cleanTerm(term), key, sources: [] };
        target[pair].entries.push(entry);
    }
    if (!entry.sources.includes(sourceName)) entry.sources.push(sourceName);
}

export function mergePairData(sourceMaps, sourceNames = SOURCE_NAMES) {
    const output = {};

    sourceMaps.forEach((sourceMap, sourceIndex) => {
        const sourceName = sourceNames[sourceIndex] || `Source ${sourceIndex + 1}`;
        for (const [pair, terms] of Object.entries(sourceMap)) {
            output[pair] ||= { pair, entries: [] };
            terms.forEach((term) => mergeEntry(output, sourceName, pair, term));
        }
    });

    return Object.fromEntries(
        Object.entries(output)
            .map(([pair, data]) => [
                pair,
                {
                    pair,
                    entries: data.entries
                        .sort((a, b) => b.sources.length - a.sources.length || a.term.localeCompare(b.term))
                        .map(({ term, sources }) => ({ term, sources }))
                }
            ])
            .sort(([a], [b]) => a.localeCompare(b))
    );
}

async function fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    return response.text();
}

async function build() {
    const fetchedAt = new Date().toISOString();
    const [csv, anki, wiki] = await Promise.all([
        fetchText(COLPI_CSV_URL),
        fetchText(COLPI_ANKI_URL),
        fetchText(SPEEDSOLVING_WIKI_URL)
    ]);
    const pairs = mergePairData([
        parseColpiCsv(csv),
        parseColpiAnki(anki),
        parseSpeedsolvingWiki(wiki)
    ]);
    const database = {
        fetchedAt,
        sources: [
            { name: SOURCE_NAMES[0], url: COLPI_CSV_URL },
            { name: SOURCE_NAMES[1], url: COLPI_ANKI_URL },
            { name: SOURCE_NAMES[2], url: 'https://www.speedsolving.com/wiki/index.php/List_of_letter_pairs' }
        ],
        pairCount: Object.keys(pairs).length,
        entryCount: Object.values(pairs).reduce((total, pair) => total + pair.entries.length, 0),
        pairs
    };
    const body = `window.BLD_PAIR_DATA = ${JSON.stringify(database)};\n`;
    await writeFile(new URL('./data.js', import.meta.url), body);
    console.log(`${database.pairCount} pairs`);
    console.log(`${database.entryCount} entries`);
    console.log(`fetched ${database.fetchedAt}`);
}

if (import.meta.url === `file://${process.argv[1]}`) build();
