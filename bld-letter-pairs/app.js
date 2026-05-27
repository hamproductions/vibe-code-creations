const db = window.BLD_PAIR_DATA;
const pairs = Object.values(db.pairs);
const sourceNames = db.sources.map((source) => source.name);
const sourceUrls = Object.fromEntries(db.sources.map((source) => [source.name, source.url]));
const sourceClass = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZʧ'.split('');
const vulgarTerms = ['ADOLF HITLER', 'ANUS', 'ASS', 'BITCH', 'BLOWJOB', 'BULL SHIT', 'BULLSHIT', 'COCK', 'CUM', 'DICK', 'DILDO', 'FAP', 'FOOTJOB', 'FUCK', 'HITLER', 'ISIS', 'KU KLUX KLAN', 'PISS', 'QUEEF', 'SEX', 'VAGINA'];
const state = {
    query: '',
    source: 'All',
    clean: false,
    first: 'A'
};

const els = {
    stats: document.getElementById('stats'),
    search: document.getElementById('searchInput'),
    clear: document.getElementById('clearButton'),
    filters: document.getElementById('filters'),
    shown: document.getElementById('shownCount'),
    firstGrid: document.getElementById('firstGrid'),
    secondGrid: document.getElementById('secondGrid'),
    pairGrid: document.getElementById('pairGrid'),
    results: document.getElementById('results')
};

function normalize(value) {
    return String(value || '').normalize('NFKC').toUpperCase();
}

function pairAliases(pair) {
    const alias = pair.replaceAll('ʧ', 'CH');
    return alias === pair ? [pair] : [pair, alias];
}

function pairLetters(pair) {
    return Array.from(pair);
}

function letterLabel(letter) {
    return letter === 'ʧ' ? 'Ch' : letter;
}

function queryParts(value) {
    return normalize(value).trim().split(/\s+/).filter(Boolean);
}

function isVulgar(term) {
    const value = normalize(term);
    return vulgarTerms.some((blocked) => value.includes(blocked));
}

function entryAllowed(entry) {
    if (state.source !== 'All' && !entry.sources.includes(state.source)) return false;
    if (state.clean && isVulgar(entry.term)) return false;
    return true;
}

function scorePair(pair, terms) {
    if (!terms.length) return 1;
    const aliases = pairAliases(pair.pair).map(normalize);
    const pairHit = terms.every((term) => aliases.some((alias) => alias.startsWith(term)));
    if (pairHit) return aliases.some((alias) => alias === terms.join('')) ? 1000 : 800;

    let best = 0;
    for (const entry of pair.entries) {
        if (!entryAllowed(entry)) continue;
        const term = normalize(entry.term);
        if (terms.every((part) => term.includes(part))) {
            const starts = terms.some((part) => term.startsWith(part));
            best = Math.max(best, starts ? 520 : 360);
        }
    }

    return best;
}

function matchingEntries(pair, terms) {
    const visible = pair.entries.filter(entryAllowed);
    if (!terms.length) return visible.slice(0, 14);
    const exactPair = pairAliases(pair.pair).map(normalize).includes(terms.join(''));
    if (exactPair) return visible.slice(0, 32);
    const matches = visible.filter((entry) => {
        const term = normalize(entry.term);
        return terms.every((part) => term.includes(part));
    });
    return matches.length ? matches.slice(0, 32) : visible.slice(0, 10);
}

function highlighted(value, terms) {
    let html = escapeHtml(value);
    for (const term of terms.sort((a, b) => b.length - a.length)) {
        const safe = escapeRegExp(escapeHtml(term));
        html = html.replace(new RegExp(safe, 'gi'), (match) => `<mark>${match}</mark>`);
    }
    return html;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function escapeRegExp(value) {
    return String(value).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function sourceHref(source, pair) {
    if (source.startsWith('CoLPI')) return `https://bestsiteever.net/colpi/?lp=${encodeURIComponent(pair)}`;
    if (source === 'Speedsolving Wiki') return `${sourceUrls[source]}#${encodeURIComponent(pair)}`;
    return sourceUrls[source];
}

function sourceChip(source, pair) {
    const label = source.replace('CoLPI ', '').replace('Speedsolving ', '');
    return `<a class="source-chip ${sourceClass(source)}" href="${escapeHtml(sourceHref(source, pair))}" target="_blank" rel="noopener noreferrer" title="Open ${escapeHtml(source)} source">${escapeHtml(label)}</a>`;
}

function resultCard(pair, terms) {
    const entries = matchingEntries(pair, terms);
    const hidden = pair.entries.filter(entryAllowed).length - entries.length;
    return `
        <article class="result-card" data-pair="${escapeHtml(pair.pair)}">
            <div class="pair-mark">
                <strong>${escapeHtml(pair.pair)}</strong>
                <span>${pair.entries.length} images</span>
            </div>
            <div class="entry-list">
                ${entries.map((entry) => `
                    <div class="entry-pill">
                        <button class="term-button" type="button" data-copy="${escapeHtml(entry.term)}">${highlighted(entry.term, terms)}</button>
                        <div class="source-list">${entry.sources.map((source) => sourceChip(source, pair.pair)).join('')}</div>
                    </div>
                `).join('')}
                ${hidden > 0 ? `<div class="more-line">+${hidden} more</div>` : ''}
            </div>
        </article>
    `;
}

function visiblePairs() {
    const terms = queryParts(state.query);
    const exact = terms.length === 1
        ? pairs.filter((pair) => pairAliases(pair.pair).map(normalize).includes(terms[0]) && pair.entries.some(entryAllowed))
        : [];
    if (exact.length) return exact;

    return pairs
        .map((pair) => ({ pair, score: scorePair(pair, terms) }))
        .filter((item) => item.score > 0 && item.pair.entries.some(entryAllowed))
        .sort((a, b) => b.score - a.score || a.pair.pair.localeCompare(b.pair.pair))
        .map((item) => item.pair);
}

function renderStats() {
    els.stats.innerHTML = [
        [db.pairCount, 'pairs'],
        [db.entryCount, 'images'],
        [sourceNames.length, 'sources']
    ].map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function renderFilters() {
    const buttons = ['All', ...sourceNames].map((source) => `
        <button type="button" class="filter-button ${state.source === source ? 'active' : ''}" data-source="${escapeHtml(source)}">${escapeHtml(source)}</button>
    `);
    buttons.push(`<button type="button" class="filter-button ${state.clean ? 'active' : ''}" data-clean="1">Clean</button>`);
    els.filters.innerHTML = buttons.join('');
}

function renderLetterSelectors(list) {
    const visible = new Set(list.map((pair) => pair.pair));
    const exactQuery = queryParts(state.query).join('');
    const activePair = pairs.find((pair) => pairAliases(pair.pair).map(normalize).includes(exactQuery));
    if (activePair) state.first = pairLetters(activePair.pair)[0];
    const matchingFirst = new Set(list.map((pair) => pairLetters(pair.pair)[0]));
    els.firstGrid.innerHTML = alphabet.map((letter) => `
        <button type="button" class="letter-button ${state.first === letter ? 'active' : ''} ${matchingFirst.has(letter) ? 'has-match' : ''}" data-first="${escapeHtml(letter)}" title="First letter ${escapeHtml(letterLabel(letter))}">${escapeHtml(letterLabel(letter))}</button>
    `).join('');

    els.secondGrid.innerHTML = alphabet.map((letter) => {
        const pair = state.first + letter;
        const data = db.pairs[pair];
        const active = activePair?.pair === pair;
        const match = visible.has(pair);
        const disabled = data && data.entries.some(entryAllowed) ? '' : 'disabled';
        return `<button type="button" class="letter-button ${active ? 'active' : ''} ${match ? 'has-match' : ''}" data-pair="${escapeHtml(pair)}" ${disabled} title="${escapeHtml(pairAliases(pair).at(-1))}">${escapeHtml(letterLabel(letter))}</button>`;
    }).join('');
}

function renderPairGrid(list) {
    const visible = new Set(list.map((pair) => pair.pair));
    els.shown.value = `${list.length}/${pairs.length}`;
    els.pairGrid.innerHTML = list.slice(0, 140).map((pair) => `
        <button type="button" class="pair-button ${visible.has(pair.pair) ? 'active' : ''}" data-pair="${escapeHtml(pair.pair)}">${escapeHtml(pair.pair)}</button>
    `).join('');
}

function renderResults() {
    const terms = queryParts(state.query);
    const list = visiblePairs();
    renderLetterSelectors(list);
    renderPairGrid(list);
    if (!list.length) {
        els.results.innerHTML = '<div class="empty">No matching pairs</div>';
        return;
    }
    els.results.innerHTML = list.slice(0, 80).map((pair) => resultCard(pair, terms)).join('');
}

function setQuery(value) {
    state.query = value;
    els.search.value = value;
    renderResults();
}

function bindEvents() {
    els.search.addEventListener('input', () => setQuery(els.search.value));
    els.clear.addEventListener('click', () => setQuery(''));
    els.filters.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.source) state.source = button.dataset.source;
        if (button.dataset.clean) state.clean = !state.clean;
        renderFilters();
        renderResults();
    });
    els.firstGrid.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-first]');
        if (!button) return;
        state.first = button.dataset.first;
        renderResults();
    });
    els.secondGrid.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-pair]');
        if (button) setQuery(pairAliases(button.dataset.pair).at(-1));
    });
    els.pairGrid.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-pair]');
        if (button) setQuery(pairAliases(button.dataset.pair).at(-1));
    });
    els.results.addEventListener('click', async (event) => {
        if (event.target.closest('a')) return;
        const button = event.target.closest('button[data-copy]');
        if (!button) return;
        await navigator.clipboard?.writeText(button.dataset.copy);
        button.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: 180 });
    });
}

renderStats();
renderFilters();
renderResults();
bindEvents();
