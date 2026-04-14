const { useState, useEffect, useCallback, useMemo } = React;

const STORAGE_KEY = 'address-labels';

function save(key, val) { try { localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(val)); } catch {} }
function load(key, fb) { try { const v = localStorage.getItem(`${STORAGE_KEY}-${key}`); return v ? JSON.parse(v) : fb; } catch { return fb; } }

function parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    return lines.slice(1).map(line => {
        const vals = [];
        let cur = '', inQ = false;
        for (const ch of line) {
            if (ch === '"') { inQ = !inQ; continue; }
            if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
            cur += ch;
        }
        vals.push(cur.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
    });
}

function emptyAddress() {
    return { postal: '', addr1: '', addr2: '', addr3: '', company: '', dept: '', name: '', honorific: '様', note: '', copies: 1 };
}

const HONORIFICS = ['様', '御中', '殿', '先生', ''];

function App() {
    const [addresses, setAddresses] = useState(() => load('addresses', [emptyAddress()]));
    const [orientation, setOrientation] = useState(() => load('orientation', 'horizontal'));
    const [labelW, setLabelW] = useState(() => load('labelW', 90));
    const [labelH, setLabelH] = useState(() => load('labelH', 55));
    const [addrSize, setAddrSize] = useState(() => load('addrSize', 10));
    const [nameSize, setNameSize] = useState(() => load('nameSize', 14));
    const [postalSize, setPostalSize] = useState(() => load('postalSize', 9));
    const [padding, setPadding] = useState(() => load('padding', 3));
    const [gap, setGap] = useState(() => load('gap', 4));
    const [showGuides, setShowGuides] = useState(() => load('showGuides', true));
    const [tab, setTab] = useState('data');

    useEffect(() => { save('addresses', addresses); }, [addresses]);
    useEffect(() => { save('orientation', orientation); }, [orientation]);
    useEffect(() => { save('labelW', labelW); }, [labelW]);
    useEffect(() => { save('labelH', labelH); }, [labelH]);
    useEffect(() => { save('addrSize', addrSize); }, [addrSize]);
    useEffect(() => { save('nameSize', nameSize); }, [nameSize]);
    useEffect(() => { save('postalSize', postalSize); }, [postalSize]);
    useEffect(() => { save('padding', padding); }, [padding]);
    useEffect(() => { save('gap', gap); }, [gap]);
    useEffect(() => { save('showGuides', showGuides); }, [showGuides]);

    const updateAddr = useCallback((i, k, v) => {
        setAddresses(prev => prev.map((a, j) => j === i ? { ...a, [k]: v } : a));
    }, []);
    const addAddr = useCallback(() => setAddresses(p => [...p, emptyAddress()]), []);
    const rmAddr = useCallback((i) => setAddresses(p => p.filter((_, j) => j !== i)), []);
    const dupAddr = useCallback((i) => setAddresses(p => { const c = [...p]; c.splice(i + 1, 0, { ...p[i] }); return c; }), []);

    const importCSV = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const rows = parseCSV(ev.target.result);
            if (!rows.length) return;
            const mapped = rows.map(r => ({
                postal: r['postal'] || r['〒'] || r['郵便番号'] || '',
                addr1: r['addr1'] || r['住所1'] || r['address'] || r['住所'] || '',
                addr2: r['addr2'] || r['住所2'] || r['building'] || r['建物'] || '',
                addr3: r['addr3'] || r['住所3'] || '',
                company: r['company'] || r['会社'] || r['会社名'] || '',
                dept: r['dept'] || r['部署'] || '',
                name: r['name'] || r['名前'] || r['氏名'] || r['宛名'] || '',
                honorific: r['honorific'] || r['敬称'] || '様',
                note: r['note'] || r['備考'] || '',
                copies: parseInt(r['copies'] || r['部数']) || 1
            }));
            setAddresses(mapped);
        };
        reader.readAsText(file);
        e.target.value = '';
    }, []);

    const expandedLabels = useMemo(() => {
        const out = [];
        addresses.forEach(a => {
            const n = Math.max(1, a.copies || 1);
            for (let i = 0; i < n; i++) out.push(a);
        });
        return out;
    }, [addresses]);

    const pageW = 210;
    const pageH = 297;
    const printMargin = 10;
    const usableW = pageW - printMargin * 2;
    const usableH = pageH - printMargin * 2;
    const cols = Math.max(1, Math.floor((usableW + gap) / (labelW + gap)));
    const rows = Math.max(1, Math.floor((usableH + gap) / (labelH + gap)));
    const perPage = cols * rows;
    const totalLabels = expandedLabels.length;
    const pageCount = Math.max(1, Math.ceil(totalLabels / perPage));
    const offsetX = (pageW - (cols * labelW + (cols - 1) * gap)) / 2;
    const offsetY = (pageH - (rows * labelH + (rows - 1) * gap)) / 2;

    const pages = useMemo(() => {
        const result = [];
        for (let p = 0; p < pageCount; p++) {
            result.push(expandedLabels.slice(p * perPage, (p + 1) * perPage));
        }
        return result;
    }, [expandedLabels, perPage, pageCount]);

    const ic = 'bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500';

    return React.createElement('div', { className: 'flex flex-col h-screen' },
        React.createElement('header', { className: 'bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0' },
            React.createElement('h1', { className: 'text-lg font-bold text-white' }, 'Address Label Printer'),
            React.createElement('span', { className: 'text-xs text-gray-500' },
                `${totalLabels} labels · ${cols}×${rows}/page · ${pageCount} page${pageCount > 1 ? 's' : ''}`
            ),
            React.createElement('div', { className: 'flex-1' }),
            React.createElement('button', {
                onClick: () => window.print(),
                className: 'px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium transition'
            }, 'Print')
        ),

        React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
            React.createElement('div', { className: 'w-[420px] bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-hidden' },
                React.createElement('div', { className: 'flex border-b border-gray-800' },
                    ['data', 'layout'].map(t =>
                        React.createElement('button', {
                            key: t,
                            className: `flex-1 py-2 text-xs font-medium border-b-2 transition ${tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`,
                            onClick: () => setTab(t)
                        }, t === 'data' ? 'Addresses' : 'Layout & Style')
                    )
                ),
                React.createElement('div', { className: 'flex-1 overflow-y-auto p-3' },
                    tab === 'data' && React.createElement(DataTab, { addresses, updateAddr, addAddr, rmAddr, dupAddr, importCSV, ic }),
                    tab === 'layout' && React.createElement(LayoutTab, {
                        orientation, setOrientation, labelW, setLabelW, labelH, setLabelH,
                        addrSize, setAddrSize, nameSize, setNameSize, postalSize, setPostalSize,
                        padding, setPadding, gap, setGap, showGuides, setShowGuides, ic
                    })
                )
            ),

            React.createElement('div', { className: 'flex-1 overflow-auto bg-gray-950 p-6' },
                React.createElement('div', { id: 'print-area' },
                    pages.map((labels, pi) =>
                        React.createElement('div', {
                            key: pi,
                            className: 'bg-white text-black mx-auto mb-8 relative',
                            style: { width: `${pageW}mm`, height: `${pageH}mm`, fontFamily: '"Noto Sans JP", sans-serif', pageBreakAfter: 'always' }
                        },
                            labels.map((addr, i) => {
                                const col = i % cols;
                                const row = Math.floor(i / cols);
                                if (row >= rows) return null;
                                const x = offsetX + col * (labelW + gap);
                                const y = offsetY + row * (labelH + gap);
                                return React.createElement('div', {
                                    key: i,
                                    className: `absolute overflow-hidden ${showGuides ? 'trim-guide' : ''}`,
                                    style: { left: `${x}mm`, top: `${y}mm`, width: `${labelW}mm`, height: `${labelH}mm`, padding: `${padding}mm` }
                                },
                                    React.createElement(Label, { addr, orientation, addrSize, nameSize, postalSize })
                                );
                            })
                        )
                    )
                )
            )
        )
    );
}

function DataTab({ addresses, updateAddr, addAddr, rmAddr, dupAddr, importCSV, ic }) {
    return React.createElement('div', { className: 'space-y-2' },
        React.createElement('div', { className: 'flex gap-2 mb-2' },
            React.createElement('button', { onClick: addAddr, className: 'flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs transition' }, '+ Address'),
            React.createElement('label', { className: 'flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center cursor-pointer transition' },
                'CSV Import',
                React.createElement('input', { type: 'file', accept: '.csv,.txt', onChange: importCSV, className: 'hidden' })
            )
        ),
        React.createElement('div', { className: 'text-[10px] text-gray-600 mb-2' },
            'CSV: postal, addr1, addr2, addr3, company, dept, name, honorific, note, copies'
        ),
        addresses.map((a, i) =>
            React.createElement('div', { key: i, className: 'p-2.5 bg-gray-800 rounded-lg border border-gray-700 space-y-1.5' },
                React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                    React.createElement('span', { className: 'text-[10px] text-gray-500 font-mono' }, `#${i + 1}`),
                    React.createElement('div', { className: 'flex-1' }),
                    React.createElement('span', { className: 'text-[10px] text-gray-500' }, 'Copies'),
                    React.createElement('input', {
                        type: 'number', value: a.copies, min: 1, max: 100,
                        onChange: e => updateAddr(i, 'copies', Math.max(1, parseInt(e.target.value) || 1)),
                        className: `w-12 ${ic} text-center`
                    }),
                    React.createElement('button', { onClick: () => dupAddr(i), className: 'text-gray-500 hover:text-gray-300 text-xs px-1' }, '⧉'),
                    addresses.length > 1 && React.createElement('button', { onClick: () => rmAddr(i), className: 'text-gray-500 hover:text-red-400 text-xs px-1' }, '✕')
                ),
                // Row: postal + name + honorific
                React.createElement('div', { className: 'flex gap-1.5' },
                    React.createElement('input', { placeholder: '〒000-0000', value: a.postal, onChange: e => updateAddr(i, 'postal', e.target.value), className: `w-28 ${ic}` }),
                    React.createElement('input', { placeholder: '氏名', value: a.name, onChange: e => updateAddr(i, 'name', e.target.value), className: `flex-1 ${ic}` }),
                    React.createElement('select', {
                        value: a.honorific, onChange: e => updateAddr(i, 'honorific', e.target.value),
                        className: `w-14 ${ic}`
                    }, HONORIFICS.map(h => React.createElement('option', { key: h, value: h }, h || '(none)')))
                ),
                // Row: company + dept
                React.createElement('div', { className: 'flex gap-1.5' },
                    React.createElement('input', { placeholder: '会社名', value: a.company, onChange: e => updateAddr(i, 'company', e.target.value), className: `flex-1 ${ic}` }),
                    React.createElement('input', { placeholder: '部署', value: a.dept, onChange: e => updateAddr(i, 'dept', e.target.value), className: `flex-1 ${ic}` })
                ),
                // Address lines
                React.createElement('input', { placeholder: '住所1', value: a.addr1, onChange: e => updateAddr(i, 'addr1', e.target.value), className: `w-full ${ic}` }),
                React.createElement('input', { placeholder: '住所2 (建物等)', value: a.addr2, onChange: e => updateAddr(i, 'addr2', e.target.value), className: `w-full ${ic}` }),
                // Row: addr3 + note
                React.createElement('div', { className: 'flex gap-1.5' },
                    React.createElement('input', { placeholder: '住所3', value: a.addr3, onChange: e => updateAddr(i, 'addr3', e.target.value), className: `flex-1 ${ic}` }),
                    React.createElement('input', { placeholder: '備考 (履歴書在中等)', value: a.note, onChange: e => updateAddr(i, 'note', e.target.value), className: `w-32 ${ic}` })
                )
            )
        )
    );
}

function LayoutTab({ orientation, setOrientation, labelW, setLabelW, labelH, setLabelH, addrSize, setAddrSize, nameSize, setNameSize, postalSize, setPostalSize, padding, setPadding, gap, setGap, showGuides, setShowGuides, ic }) {
    const row = (label, val, set, min, max, step = 1, unit = 'mm') =>
        React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('span', { className: 'text-xs text-gray-500 w-24 shrink-0' }, label),
            React.createElement('input', {
                type: 'range', min, max, step, value: val,
                onChange: e => set(parseFloat(e.target.value)),
                className: 'flex-1'
            }),
            React.createElement('input', {
                type: 'number', min, max, step, value: val,
                onChange: e => set(parseFloat(e.target.value) || min),
                className: `w-16 ${ic} text-center`
            }),
            React.createElement('span', { className: 'text-[10px] text-gray-600 w-6' }, unit)
        );

    return React.createElement('div', { className: 'space-y-3' },
        React.createElement('div', { className: 'text-[10px] text-gray-500 uppercase tracking-wider mb-1' }, 'Orientation'),
        React.createElement('div', { className: 'flex gap-2 mb-3' },
            ['horizontal', 'vertical'].map(o =>
                React.createElement('button', {
                    key: o,
                    onClick: () => setOrientation(o),
                    className: `flex-1 py-1.5 text-xs rounded transition ${orientation === o ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`
                }, o === 'horizontal' ? '横書き Horizontal' : '縦書き Vertical')
            )
        ),

        React.createElement('div', { className: 'text-[10px] text-gray-500 uppercase tracking-wider mb-1' }, 'Label Size'),
        row('Width', labelW, setLabelW, 30, 200, 1),
        row('Height', labelH, setLabelH, 20, 200, 1),
        row('Padding', padding, setPadding, 0, 15, 0.5),
        row('Gap', gap, setGap, 0, 20, 0.5),

        React.createElement('div', { className: 'text-[10px] text-gray-500 uppercase tracking-wider mb-1 mt-3' }, 'Font Sizes'),
        row('Postal 〒', postalSize, setPostalSize, 6, 20, 0.5, 'pt'),
        row('Address', addrSize, setAddrSize, 6, 24, 0.5, 'pt'),
        row('Name', nameSize, setNameSize, 8, 30, 0.5, 'pt'),

        React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer mt-2' },
            React.createElement('input', { type: 'checkbox', checked: showGuides, onChange: e => setShowGuides(e.target.checked), className: 'w-3.5 h-3.5' }),
            React.createElement('span', { className: 'text-xs text-gray-400' }, 'Trim guides')
        )
    );
}

function verticalText(str) {
    const fixed = str.replace(/-/g, '－').replace(/\(/g, '（').replace(/\)/g, '）');
    const parts = [];
    const regex = /([0-9A-Za-z]{1,2})/g;
    let match, last = 0;
    while ((match = regex.exec(fixed)) !== null) {
        if (match.index > last) parts.push(fixed.slice(last, match.index));
        parts.push(React.createElement('span', { key: match.index, className: 'tcy' }, match[0]));
        last = regex.lastIndex;
    }
    if (last < fixed.length) parts.push(fixed.slice(last));
    return parts;
}

function Label({ addr, orientation, addrSize, nameSize, postalSize }) {
    const hasContent = addr.postal || addr.addr1 || addr.name || addr.company;
    if (!hasContent) return null;

    const addrLines = [addr.addr1, addr.addr2, addr.addr3].filter(Boolean);
    const nameStr = addr.name + (addr.honorific ? ` ${addr.honorific}` : '');
    const companyStr = [addr.company, addr.dept].filter(Boolean).join(' ');

    if (orientation === 'vertical') {
        return React.createElement('div', {
            style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }
        },
            // Postal — horizontal, right-aligned
            addr.postal && React.createElement('div', {
                style: {
                    fontSize: `${postalSize}pt`, letterSpacing: '0.25em',
                    textAlign: 'center', color: '#333', marginBottom: '1.5mm', shrink: 0
                }
            }, `〒${addr.postal}`),

            // Body — horizontal flex: [note] [name+co] [address]
            React.createElement('div', {
                style: { flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }
            },
                // Note — far left
                addr.note && React.createElement('div', {
                    className: 'vtext',
                    style: {
                        writingMode: 'vertical-rl', fontSize: `${Math.max(7, postalSize - 1)}pt`,
                        color: '#c00', border: '1px solid #c00', padding: '1mm 0.3mm',
                        lineHeight: 1.3, alignSelf: 'flex-end', marginRight: '1mm', flexShrink: 0
                    }
                }, verticalText(addr.note)),

                // Name + Company — center, takes remaining space
                React.createElement('div', {
                    className: 'vtext',
                    style: {
                        flex: 1, writingMode: 'vertical-rl',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        gap: '0.5mm', overflow: 'hidden'
                    }
                },
                    companyStr && React.createElement('div', {
                        style: { fontSize: `${addrSize}pt`, lineHeight: 1.7 }
                    }, verticalText(companyStr)),
                    nameStr && React.createElement('div', {
                        style: { fontSize: `${nameSize}pt`, fontWeight: 700, lineHeight: 1.7 }
                    }, verticalText(nameStr))
                ),

                // Address — right side
                addrLines.length > 0 && React.createElement('div', {
                    className: 'vtext',
                    style: {
                        writingMode: 'vertical-rl', fontSize: `${addrSize}pt`,
                        lineHeight: 1.7, flexShrink: 0, marginLeft: '1.5mm'
                    }
                }, addrLines.map((line, i) =>
                    React.createElement('div', { key: i }, verticalText(line))
                ))
            )
        );
    }

    // Horizontal layout
    return React.createElement('div', {
        style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }
    },
        addr.postal && React.createElement('div', {
            style: { fontSize: `${postalSize}pt`, color: '#333', marginBottom: '0.8mm' }
        }, `〒${addr.postal}`),
        addrLines.map((line, i) =>
            React.createElement('div', { key: i, style: { fontSize: `${addrSize}pt`, lineHeight: 1.5 } }, line)
        ),
        companyStr && React.createElement('div', {
            style: { fontSize: `${addrSize}pt`, lineHeight: 1.5, marginTop: '0.5mm' }
        }, companyStr),
        nameStr && React.createElement('div', {
            style: { fontSize: `${nameSize}pt`, fontWeight: 700, marginTop: '1mm', lineHeight: 1.3 }
        }, nameStr),
        addr.note && React.createElement('div', {
            style: { fontSize: `${postalSize}pt`, color: '#c00', marginTop: '1mm', border: '1px solid #c00', padding: '0.3mm 1mm', display: 'inline-block', alignSelf: 'flex-start' }
        }, addr.note)
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
