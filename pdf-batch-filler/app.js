const { useState, useEffect, useRef, useCallback, useMemo } = React;

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const PDFLIB_CDN = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const FONTKIT_CDN = 'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js';
const NOTO_SANS_JP_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf';
const NOTO_SANS_JP_BOLD_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.ttf';

const STORAGE_KEY = 'pdf-batch-filler';
const FIELD_COLORS = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#22d3ee','#e879f9'];

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function saveState(key, val) {
    try { localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(val)); } catch {}
}
function loadState(key, fallback) {
    try { const v = localStorage.getItem(`${STORAGE_KEY}-${key}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function openIDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(STORAGE_KEY, 1);
        req.onupgradeneeded = () => req.result.createObjectStore('blobs');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
async function saveBlob(key, data) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put(data, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}
async function loadBlob(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('blobs', 'readonly');
        const req = tx.objectStore('blobs').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}


function App() {
    const [libsReady, setLibsReady] = useState(false);
    const [hasPdf, setHasPdf] = useState(false);
    const pdfBytesRef = useRef(null);
    const [pdfName, setPdfName] = useState('');
    const [pageImages, setPageImages] = useState([]);
    const [pageDims, setPageDims] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [includedPages, setIncludedPages] = useState(() => loadState('includedPages', []));
    const [fields, setFields] = useState(() => loadState('fields', []));
    const [variants, setVariants] = useState(() => loadState('variants', [{}]));
    const [globalData, setGlobalData] = useState(() => loadState('globalData', {}));
    const [selectedField, setSelectedField] = useState(null);
    const [activeTab, setActiveTab] = useState('fields');
    const [previewRow, setPreviewRow] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState('');
    const [previewScale, setPreviewScale] = useState(1);
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const dragInfo = useRef(null);
    const resizeInfo = useRef(null);

    useEffect(() => { saveState('fields', fields); }, [fields]);
    useEffect(() => { saveState('variants', variants); }, [variants]);
    useEffect(() => { saveState('globalData', globalData); }, [globalData]);
    useEffect(() => { saveState('includedPages', includedPages); }, [includedPages]);

    useEffect(() => {
        Promise.all([loadScript(PDFJS_CDN), loadScript(PDFLIB_CDN), loadScript(FONTKIT_CDN)])
            .then(() => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
                setLibsReady(true);
            })
            .catch(e => console.error('Failed to load libs:', e));
    }, []);

    useEffect(() => {
        if (!libsReady) return;
        loadBlob('pdfBytes').then(bytes => {
            if (bytes) {
                const name = loadState('pdfName', 'restored.pdf');
                loadPdfFromBuffer(bytes.buffer, name, true);
            }
        }).catch(() => {});
    }, [libsReady, loadPdfFromBuffer]);

    const rasterizePdf = useCallback(async (buffer) => {
        const pdf = await window.pdfjsLib.getDocument({
            data: buffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        }).promise;
        const pages = [];
        const dims = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const vp1 = page.getViewport({ scale: 1.0 });
            dims.push({ width: vp1.width, height: vp1.height });
            const vp = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
            pages.push(canvas.toDataURL('image/jpeg', 0.8));
        }
        return { images: pages, dims, numPages: pdf.numPages };
    }, []);

    const loadPdfFromBuffer = useCallback(async (buffer, name, skipSave) => {
        const copy = new Uint8Array(new Uint8Array(buffer)).slice();
        pdfBytesRef.current = copy;
        setHasPdf(true);
        const pName = name || 'uploaded.pdf';
        setPdfName(pName);
        const { images, dims, numPages } = await rasterizePdf(copy.buffer.slice(0));
        setPageImages(images);
        setPageDims(dims);
        setTotalPages(numPages);
        setCurrentPage(0);
        setIncludedPages(prev => {
            if (prev.length > 0 && prev.every(p => p < numPages)) return prev;
            return Array.from({ length: numPages }, (_, i) => i);
        });
        if (!skipSave) {
            saveBlob('pdfBytes', copy).catch(() => {});
            saveState('pdfName', pName);
        }
    }, [rasterizePdf]);

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        loadPdfFromBuffer(buffer, file.name);
    }, [loadPdfFromBuffer]);

    const addField = useCallback((type) => {
        const f = {
            id: uid(),
            type,
            name: `${type === 'check' ? 'Check' : 'Field'}_${fields.length + 1}`,
            x: 0.1,
            y: 0.1,
            fontSize: type === 'check' ? 14 : 12,
            color: FIELD_COLORS[fields.length % FIELD_COLORS.length],
            page: currentPage,
            isGlobal: false,
            fontWeight: 'normal'
        };
        setFields(prev => [...prev, f]);
        setSelectedField(f.id);
    }, [fields.length, currentPage]);

    const updateField = useCallback((id, updates) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }, []);

    const deleteField = useCallback((id) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (selectedField === id) setSelectedField(null);
    }, [selectedField]);

    const duplicateField = useCallback((id) => {
        setFields(prev => {
            const src = prev.find(f => f.id === id);
            if (!src) return prev;
            const dup = { ...src, id: uid(), name: src.name + '_copy', x: Math.min(src.x + 0.02, 0.95), y: Math.min(src.y + 0.02, 0.95) };
            return [...prev, dup];
        });
    }, []);

    const pageFields = useMemo(() => fields.filter(f => f.page === currentPage), [fields, currentPage]);

    const handlePointerDown = useCallback((e, fieldId) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = containerRef.current.getBoundingClientRect();
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;
        setSelectedField(fieldId);
        dragInfo.current = {
            fieldId,
            startX: e.clientX,
            startY: e.clientY,
            origX: field.x,
            origY: field.y,
            rect
        };
        const onMove = (ev) => {
            const d = dragInfo.current;
            if (!d) return;
            const dx = (ev.clientX - d.startX) / d.rect.width;
            const dy = (ev.clientY - d.startY) / d.rect.height;
            updateField(d.fieldId, {
                x: Math.max(0, Math.min(1, d.origX + dx)),
                y: Math.max(0, Math.min(1, d.origY + dy))
            });
        };
        const onUp = () => {
            dragInfo.current = null;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [fields, updateField]);

    const handleResizeDown = useCallback((e, fieldId) => {
        e.preventDefault();
        e.stopPropagation();
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;
        resizeInfo.current = { fieldId, startY: e.clientY, origSize: field.fontSize };
        const onMove = (ev) => {
            const r = resizeInfo.current;
            if (!r) return;
            const dy = ev.clientY - r.startY;
            updateField(r.fieldId, { fontSize: Math.max(6, Math.min(72, Math.round(r.origSize + dy * 0.5))) });
        };
        const onUp = () => {
            resizeInfo.current = null;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [fields, updateField]);

    const addVariant = useCallback(() => setVariants(prev => [...prev, {}]), []);
    const removeVariant = useCallback((idx) => setVariants(prev => prev.filter((_, i) => i !== idx)), []);
    const updateVariant = useCallback((idx, fieldName, value) => {
        setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [fieldName]: value } : v));
    }, []);
    const updateGlobal = useCallback((fieldName, value) => {
        setGlobalData(prev => ({ ...prev, [fieldName]: value }));
    }, []);

    const generatePdf = useCallback(async () => {
        if (!pdfBytesRef.current || fields.length === 0 || variants.length === 0) return;
        setGenerating(true);
        setGenProgress('Loading fonts...');
        try {
            const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
            const masterDoc = await PDFDocument.create();

            let regularFontBytes = null;
            let boldFontBytes = null;
            try {
                const [regResp, boldResp] = await Promise.all([
                    fetch(NOTO_SANS_JP_URL),
                    fetch(NOTO_SANS_JP_BOLD_URL)
                ]);
                regularFontBytes = await regResp.arrayBuffer();
                boldFontBytes = await boldResp.arrayBuffer();
            } catch {
                console.warn('Font fetch failed, falling back to Helvetica');
            }

            for (let vi = 0; vi < variants.length; vi++) {
                setGenProgress(`Variant ${vi + 1}/${variants.length}...`);
                const variant = variants[vi];
                const srcDoc = await PDFDocument.load(pdfBytesRef.current.slice());
                srcDoc.registerFontkit(window.fontkit);

                let regularFont, boldFont;
                if (regularFontBytes) {
                    try {
                        regularFont = await srcDoc.embedFont(regularFontBytes, { subset: false });
                        boldFont = boldFontBytes
                            ? await srcDoc.embedFont(boldFontBytes, { subset: false })
                            : regularFont;
                    } catch {
                        regularFont = await srcDoc.embedFont(StandardFonts.Helvetica);
                        boldFont = await srcDoc.embedFont(StandardFonts.HelveticaBold);
                    }
                } else {
                    regularFont = await srcDoc.embedFont(StandardFonts.Helvetica);
                    boldFont = await srcDoc.embedFont(StandardFonts.HelveticaBold);
                }

                const srcPages = srcDoc.getPages();

                for (const field of fields) {
                    const pageIdx = field.page;
                    if (pageIdx >= srcPages.length) continue;
                    const page = srcPages[pageIdx];
                    const { width, height } = page.getSize();
                    const value = field.isGlobal ? globalData[field.name] : variant[field.name];
                    if (value === undefined || value === '' || value === false) continue;

                    const pdfX = field.x * width;
                    const pdfY = height - (field.y * height) - field.fontSize;
                    const hex = field.color.replace('#', '');
                    const r = parseInt(hex.slice(0, 2), 16) / 255;
                    const g = parseInt(hex.slice(2, 4), 16) / 255;
                    const b = parseInt(hex.slice(4, 6), 16) / 255;
                    const font = field.fontWeight === 'bold' ? boldFont : regularFont;

                    if (field.type === 'check' && value === true) {
                        const s = field.fontSize;
                        const cx = pdfX + s * 0.15;
                        const cy = pdfY + s * 0.15;
                        const ex = pdfX + s * 0.85;
                        const ey = pdfY + s * 0.85;
                        const mx = cx + (ex - cx) * 0.3;
                        const my = cy;
                        const t = Math.max(1.5, s * 0.1);
                        page.drawLine({ start: { x: cx, y: cy + (ey - cy) * 0.45 }, end: { x: mx, y: my }, thickness: t, color: rgb(r, g, b) });
                        page.drawLine({ start: { x: mx, y: my }, end: { x: ex, y: ey }, thickness: t, color: rgb(r, g, b) });
                    } else if (field.type === 'text' && typeof value === 'string' && value.length > 0) {
                        const lines = value.split('\n');
                        const lineH = field.fontSize * 1.3;
                        lines.forEach((line, li) => {
                            if (line.length > 0) {
                                const y = pdfY - (li * lineH);
                                page.drawText(line, { x: pdfX, y, size: field.fontSize, font, color: rgb(r, g, b) });
                            }
                        });
                    }
                }

                const pageIndices = includedPages.length > 0 ? includedPages : srcDoc.getPageIndices();
                const copiedPages = await masterDoc.copyPages(srcDoc, pageIndices);
                copiedPages.forEach(p => masterDoc.addPage(p));
            }

            setGenProgress('Serializing...');
            const outBytes = await masterDoc.save();
            const blob = new Blob([outBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `batch_${pdfName || 'output.pdf'}`;
            a.click();
            URL.revokeObjectURL(url);
            setGenProgress('Done!');
        } catch (err) {
            console.error(err);
            setGenProgress(`Error: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    }, [hasPdf, pdfName, fields, variants, globalData, includedPages]);

    const exportTemplate = useCallback(() => {
        const data = { fields, variants, globalData };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [fields, variants, globalData]);

    const importTemplate = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.fields) setFields(data.fields);
                if (data.variants) setVariants(data.variants);
                if (data.globalData) setGlobalData(data.globalData);
            } catch {}
        };
        reader.readAsText(file);
        e.target.value = '';
    }, []);

    const clearAll = useCallback(() => {
        if (!confirm('Clear all fields, variants, and global data?')) return;
        setFields([]);
        setVariants([{}]);
        setGlobalData({});
        setSelectedField(null);
    }, []);

    const globalFields = useMemo(() => fields.filter(f => f.isGlobal), [fields]);
    const variantFields = useMemo(() => fields.filter(f => !f.isGlobal), [fields]);
    const selectedFieldData = useMemo(() => fields.find(f => f.id === selectedField), [fields, selectedField]);

    if (!libsReady) {
        return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' },
            React.createElement('div', { className: 'text-gray-400 text-lg' }, 'Loading PDF libraries...')
        );
    }

    return React.createElement('div', { className: 'flex flex-col h-screen' },
        // Header
        React.createElement('header', { className: 'bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4 shrink-0' },
            React.createElement('h1', { className: 'text-lg font-bold text-white' }, 'PDF Batch Auto-Filler'),
            React.createElement('label', { className: 'px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm cursor-pointer transition' },
                hasPdf ? 'Change PDF' : 'Upload PDF',
                React.createElement('input', { type: 'file', accept: '.pdf', onChange: handleFileUpload, className: 'hidden' })
            ),
            pdfName && React.createElement('span', { className: 'text-sm text-gray-400 truncate max-w-xs' }, pdfName),
            React.createElement('div', { className: 'flex-1' }),
            React.createElement('label', { className: 'px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer transition' },
                'Import',
                React.createElement('input', { type: 'file', accept: '.json', onChange: importTemplate, className: 'hidden' })
            ),
            React.createElement('button', { onClick: exportTemplate, className: 'px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition' }, 'Export'),
            React.createElement('button', { onClick: clearAll, className: 'px-3 py-1.5 bg-red-700/50 hover:bg-red-600/50 rounded text-sm transition' }, 'Clear'),
        ),

        // Main layout
        React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
            // Left: PDF preview
            React.createElement('div', { className: 'flex-1 flex flex-col bg-gray-950 min-w-0' },
                hasPdf && React.createElement('div', { className: 'flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800' },
                    totalPages > 1 && React.createElement('button', {
                        onClick: () => setCurrentPage(p => Math.max(0, p - 1)),
                        disabled: currentPage === 0,
                        className: 'px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-30'
                    }, '←'),
                    totalPages > 1 && React.createElement('span', { className: 'text-xs text-gray-300' }, `Pg ${currentPage + 1}/${totalPages}`),
                    totalPages > 1 && React.createElement('button', {
                        onClick: () => setCurrentPage(p => Math.min(totalPages - 1, p + 1)),
                        disabled: currentPage === totalPages - 1,
                        className: 'px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-30'
                    }, '→'),
                    React.createElement('label', { className: 'flex items-center gap-1 ml-2 cursor-pointer' },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: includedPages.includes(currentPage),
                            onChange: e => {
                                setIncludedPages(prev =>
                                    e.target.checked
                                        ? [...prev, currentPage].sort((a, b) => a - b)
                                        : prev.filter(p => p !== currentPage)
                                );
                            },
                            className: 'w-3 h-3'
                        }),
                        React.createElement('span', { className: 'text-[10px] text-gray-400' }, 'Include')
                    ),
                    React.createElement('div', { className: 'flex-1' }),
                    React.createElement('span', { className: 'text-xs text-gray-500' }, 'Preview:'),
                    React.createElement('button', {
                        onClick: () => setPreviewRow(p => Math.max(0, p - 1)),
                        disabled: previewRow === 0,
                        className: 'px-1.5 py-0.5 bg-gray-700 rounded text-xs disabled:opacity-30'
                    }, '◀'),
                    React.createElement('span', { className: 'text-xs text-gray-300 min-w-[60px] text-center' }, `Row ${previewRow + 1}/${variants.length}`),
                    React.createElement('button', {
                        onClick: () => setPreviewRow(p => Math.min(variants.length - 1, p + 1)),
                        disabled: previewRow >= variants.length - 1,
                        className: 'px-1.5 py-0.5 bg-gray-700 rounded text-xs disabled:opacity-30'
                    }, '▶'),
                ),
                React.createElement('div', { className: 'flex-1 overflow-auto flex items-start justify-center p-4' },
                    pageImages[currentPage]
                        ? React.createElement('div', {
                            ref: containerRef,
                            className: 'relative inline-block shadow-2xl',
                            style: { maxWidth: '100%' },
                            onClick: () => setSelectedField(null)
                        },
                            React.createElement('img', {
                                ref: imgRef,
                                src: pageImages[currentPage],
                                className: 'block max-h-[80vh] w-auto',
                                draggable: false,
                                onLoad: (e) => {
                                    const dim = pageDims[currentPage];
                                    if (dim) setPreviewScale(e.target.clientWidth / dim.width);
                                }
                            }),
                            pageFields.map(f => {
                                const previewVal = f.isGlobal ? globalData[f.name] : (variants[previewRow] || {})[f.name];
                                const label = f.type === 'check'
                                    ? (previewVal ? '✓' : '☐')
                                    : (previewVal || f.name);
                                const scaledSize = f.fontSize * previewScale;
                                return React.createElement('div', {
                                    key: f.id,
                                    className: `field-marker absolute flex items-center ${selectedField === f.id ? 'ring-2 ring-white' : ''}`,
                                    style: {
                                        left: `${f.x * 100}%`,
                                        top: `${f.y * 100}%`,
                                        color: f.color,
                                        fontSize: `${scaledSize}px`,
                                        lineHeight: 1,
                                        whiteSpace: 'nowrap',
                                    },
                                    onPointerDown: (e) => handlePointerDown(e, f.id),
                                },
                                    f.type === 'check'
                                        ? React.createElement('span', {
                                            style: { width: scaledSize, height: scaledSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: `${scaledSize * 0.8}px`, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.2)' }
                                        }, previewVal ? '✓' : '☐')
                                        : React.createElement('span', {
                                            style: { borderLeft: `2px solid ${f.color}`, backgroundColor: 'rgba(0,0,0,0.3)', padding: '0 2px', opacity: previewVal ? 1 : 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.3, fontWeight: f.fontWeight || 'normal' }
                                        }, label),
                                    selectedField === f.id && React.createElement('div', {
                                        className: 'absolute -right-2 -bottom-2 w-3 h-3 bg-white rounded-full cursor-ns-resize',
                                        onPointerDown: (e) => handleResizeDown(e, f.id)
                                    })
                                );
                            })
                        )
                        : React.createElement('div', { className: 'text-gray-500 text-center mt-20' },
                            React.createElement('p', { className: 'text-4xl mb-4' }, '📄'),
                            React.createElement('p', null, 'Upload a PDF to get started')
                        )
                )
            ),

            // Right: Panel
            React.createElement('div', { className: 'w-96 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-hidden' },
                // Tabs
                React.createElement('div', { className: 'flex border-b border-gray-800' },
                    ['fields', 'data', 'generate'].map(tab =>
                        React.createElement('button', {
                            key: tab,
                            'data-tab': true,
                            className: `flex-1 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`,
                            onClick: () => setActiveTab(tab)
                        }, tab.charAt(0).toUpperCase() + tab.slice(1))
                    )
                ),

                // Tab content — fields tab splits into list (top) + editor (bottom)
                activeTab === 'fields'
                    ? React.createElement(FieldsPanel, {
                        fields, pageFields, currentPage, selectedField, selectedFieldData,
                        addField, updateField, deleteField, duplicateField, setSelectedField
                    })
                    : React.createElement('div', { className: 'flex-1 overflow-y-auto p-4' },
                        activeTab === 'data' && React.createElement(DataPanel, {
                            globalFields, variantFields, variants, globalData,
                            updateVariant, updateGlobal, addVariant, removeVariant
                        }),
                        activeTab === 'generate' && React.createElement(GeneratePanel, {
                            hasPdf, fields, variants, generating, genProgress, generatePdf, includedPages, totalPages
                        })
                    )
            )
        )
    );
}

function FieldsPanel({ fields, pageFields, currentPage, selectedField, selectedFieldData, addField, updateField, deleteField, duplicateField, setSelectedField }) {
    return React.createElement('div', { className: 'flex flex-col flex-1 overflow-hidden' },
        // Toolbar
        React.createElement('div', { className: 'flex gap-2 p-3 border-b border-gray-800' },
            React.createElement('button', { onClick: () => addField('text'), className: 'flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs transition' }, '+ Text'),
            React.createElement('button', { onClick: () => addField('check'), className: 'flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs transition' }, '+ Check'),
            React.createElement('span', { className: 'text-xs text-gray-500 self-center whitespace-nowrap' }, `${fields.length}`)
        ),
        // Compact field list — scrollable
        React.createElement('div', { className: 'flex-1 overflow-y-auto min-h-0' },
            fields.map(f =>
                React.createElement('div', {
                    key: f.id,
                    className: `flex items-center gap-2 px-3 py-1.5 cursor-pointer border-l-2 transition text-xs ${
                        selectedField === f.id
                            ? 'bg-gray-800 border-indigo-500'
                            : f.page === currentPage
                                ? 'border-transparent hover:bg-gray-800/50'
                                : 'border-transparent opacity-40 hover:opacity-70 hover:bg-gray-800/30'
                    }`,
                    onClick: () => setSelectedField(f.id)
                },
                    React.createElement('div', { className: 'w-2 h-2 rounded-full shrink-0', style: { backgroundColor: f.color } }),
                    React.createElement('span', { className: 'truncate flex-1 font-medium' }, f.name),
                    f.isGlobal && React.createElement('span', { className: 'text-[10px] text-yellow-400 shrink-0' }, 'G'),
                    React.createElement('span', { className: 'text-gray-600 shrink-0 w-4 text-center' }, `${f.page + 1}`),
                    React.createElement('span', { className: 'text-gray-600 shrink-0 w-6' }, f.type === 'check' ? '☑' : 'Aa'),
                    React.createElement('button', { onClick: (e) => { e.stopPropagation(); duplicateField(f.id); }, className: 'text-gray-600 hover:text-gray-300 shrink-0' }, '⧉'),
                    React.createElement('button', { onClick: (e) => { e.stopPropagation(); deleteField(f.id); }, className: 'text-gray-600 hover:text-red-400 shrink-0' }, '✕'),
                )
            )
        ),
        // Editor — fixed bottom
        selectedFieldData
            ? React.createElement(FieldEditor, { field: selectedFieldData, updateField })
            : React.createElement('div', { className: 'p-3 border-t border-gray-800 text-xs text-gray-600 text-center' }, 'Select a field to edit')
    );
}

const SWATCHES = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#22d3ee','#e879f9','#ef4444','#ffffff','#000000','#6b7280'];

function FieldEditor({ field, updateField }) {
    const inp = 'bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500';
    return React.createElement('div', { className: 'p-3 bg-gray-800 border-t border-gray-700 space-y-2 shrink-0' },
        // Row 1: name + hex input
        React.createElement('div', { className: 'flex gap-2 items-center' },
            React.createElement('input', {
                type: 'text', value: field.name,
                onChange: e => updateField(field.id, { name: e.target.value }),
                className: `flex-1 ${inp}`
            }),
            React.createElement('input', {
                type: 'text', value: field.color,
                onChange: e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateField(field.id, { color: v }); },
                className: `w-20 ${inp} font-mono`,
                style: { borderLeftColor: field.color, borderLeftWidth: 3 }
            })
        ),
        // Row 1.5: color swatches
        React.createElement('div', { className: 'flex gap-1 flex-wrap' },
            SWATCHES.map(c =>
                React.createElement('button', {
                    key: c,
                    onClick: () => updateField(field.id, { color: c }),
                    className: `w-4 h-4 rounded-sm border ${field.color === c ? 'border-white scale-125' : 'border-gray-600'} transition-transform`,
                    style: { backgroundColor: c }
                })
            )
        ),
        // Row 2: fontSize, weight, page, global
        React.createElement('div', { className: 'flex gap-1.5 items-center' },
            React.createElement('span', { className: 'text-[10px] text-gray-500' }, 'Sz'),
            React.createElement('input', {
                type: 'number', value: field.fontSize, min: 6, max: 72,
                onChange: e => updateField(field.id, { fontSize: parseInt(e.target.value) || 12 }),
                className: `w-12 ${inp}`
            }),
            ['normal','bold'].map(w =>
                React.createElement('button', {
                    key: w,
                    onClick: () => updateField(field.id, { fontWeight: w }),
                    className: `px-1.5 py-0.5 text-[10px] rounded transition ${(field.fontWeight || 'normal') === w ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`,
                    style: { fontWeight: w }
                }, w === 'normal' ? 'R' : 'B')
            ),
            React.createElement('span', { className: 'text-[10px] text-gray-500' }, 'Pg'),
            React.createElement('input', {
                type: 'number', value: field.page + 1, min: 1,
                onChange: e => updateField(field.id, { page: Math.max(0, parseInt(e.target.value) - 1 || 0) }),
                className: `w-10 ${inp}`
            }),
            React.createElement('label', { className: 'flex items-center gap-1 cursor-pointer ml-auto' },
                React.createElement('input', {
                    type: 'checkbox', checked: field.isGlobal,
                    onChange: e => updateField(field.id, { isGlobal: e.target.checked }),
                    className: 'w-3.5 h-3.5'
                }),
                React.createElement('span', { className: 'text-[10px] text-gray-400' }, 'G')
            )
        ),
        // Row 3: X/Y sliders
        React.createElement('div', { className: 'flex gap-2 items-center' },
            React.createElement('span', { className: 'text-[10px] text-gray-500 w-8' }, `X${(field.x * 100).toFixed(0)}%`),
            React.createElement('input', {
                type: 'range', min: 0, max: 1, step: 0.001, value: field.x,
                onChange: e => updateField(field.id, { x: parseFloat(e.target.value) }),
                className: 'flex-1 h-1'
            }),
            React.createElement('span', { className: 'text-[10px] text-gray-500 w-8' }, `Y${(field.y * 100).toFixed(0)}%`),
            React.createElement('input', {
                type: 'range', min: 0, max: 1, step: 0.001, value: field.y,
                onChange: e => updateField(field.id, { y: parseFloat(e.target.value) }),
                className: 'flex-1 h-1'
            })
        )
    );
}

function DataPanel({ globalFields, variantFields, variants, globalData, updateVariant, updateGlobal, addVariant, removeVariant }) {
    const cellCls = 'bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-full';
    const thCls = 'px-1 py-1.5 text-[10px] text-gray-400 font-medium text-left truncate';

    return React.createElement('div', { className: 'space-y-4' },
        // Global section — compact inline grid
        globalFields.length > 0 && React.createElement('div', null,
            React.createElement('div', { className: 'text-[10px] text-gray-500 uppercase tracking-wider mb-1' }, 'Global'),
            React.createElement('div', { className: 'grid gap-1', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' } },
                globalFields.map(f =>
                    React.createElement('div', { key: f.id, className: 'flex flex-col gap-0.5' },
                        React.createElement('span', { className: 'text-[10px] text-gray-500 truncate' }, f.name),
                        f.type === 'check'
                            ? React.createElement('input', {
                                type: 'checkbox',
                                checked: !!globalData[f.name],
                                onChange: e => updateGlobal(f.name, e.target.checked),
                                className: 'w-4 h-4'
                            })
                            : React.createElement('textarea', {
                                value: globalData[f.name] || '',
                                onChange: e => updateGlobal(f.name, e.target.value),
                                rows: 1,
                                className: cellCls + ' resize-none overflow-hidden',
                                onInput: e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }
                            })
                    )
                )
            )
        ),

        // Variants — spreadsheet table
        React.createElement('div', null,
            React.createElement('div', { className: 'flex items-center justify-between mb-1' },
                React.createElement('span', { className: 'text-[10px] text-gray-500 uppercase tracking-wider' }, `Variants (${variants.length})`),
                React.createElement('button', { onClick: addVariant, className: 'px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] transition' }, '+ Row')
            ),
            variantFields.length === 0
                ? React.createElement('p', { className: 'text-xs text-gray-500' }, 'No variant fields. Mark fields as non-Global.')
                : React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full border-collapse' },
                        React.createElement('thead', null,
                            React.createElement('tr', { className: 'border-b border-gray-700' },
                                React.createElement('th', { className: `${thCls} w-6` }, '#'),
                                variantFields.map(f =>
                                    React.createElement('th', { key: f.id, className: thCls },
                                        React.createElement('span', { className: 'flex items-center gap-1' },
                                            React.createElement('span', { className: 'w-1.5 h-1.5 rounded-full shrink-0', style: { backgroundColor: f.color } }),
                                            f.name
                                        )
                                    )
                                ),
                                React.createElement('th', { className: `${thCls} w-5` })
                            )
                        ),
                        React.createElement('tbody', null,
                            variants.map((v, vi) =>
                                React.createElement('tr', { key: vi, className: 'border-b border-gray-800 hover:bg-gray-800/30' },
                                    React.createElement('td', { className: 'px-1 py-1 text-[10px] text-gray-600 text-center' }, vi + 1),
                                    variantFields.map(f =>
                                        React.createElement('td', { key: f.id, className: 'px-0.5 py-0.5' },
                                            f.type === 'check'
                                                ? React.createElement('div', { className: 'flex justify-center' },
                                                    React.createElement('input', {
                                                        type: 'checkbox',
                                                        checked: !!v[f.name],
                                                        onChange: e => updateVariant(vi, f.name, e.target.checked),
                                                        className: 'w-3.5 h-3.5'
                                                    })
                                                )
                                                : React.createElement('textarea', {
                                                    value: v[f.name] || '',
                                                    onChange: e => updateVariant(vi, f.name, e.target.value),
                                                    rows: 1,
                                                    className: cellCls + ' resize-none overflow-hidden',
                                                    onInput: e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }
                                                })
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-0.5 py-0.5 text-center' },
                                        variants.length > 1 && React.createElement('button', {
                                            onClick: () => removeVariant(vi),
                                            className: 'text-gray-600 hover:text-red-400 text-[10px]'
                                        }, '✕')
                                    )
                                )
                            )
                        )
                    )
                )
        )
    );
}

function GeneratePanel({ hasPdf, fields, variants, generating, genProgress, generatePdf, includedPages, totalPages }) {
    const ready = hasPdf && fields.length > 0 && variants.length > 0;
    const incCount = includedPages.length || totalPages;
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'p-4 bg-gray-800 rounded-lg border border-gray-700' },
            React.createElement('h3', { className: 'text-sm font-medium text-gray-300 mb-3' }, 'Summary'),
            React.createElement('div', { className: 'space-y-1 text-sm text-gray-400' },
                React.createElement('p', null, `PDF: ${hasPdf ? '✓ Loaded' : '✗ None'}`),
                React.createElement('p', null, `Fields: ${fields.length}`),
                React.createElement('p', null, `Variants: ${variants.length}`),
                React.createElement('p', null, `Pages: ${incCount}/${totalPages} included`),
                React.createElement('p', null, `Output: ~${variants.length * incCount} pages`)
            )
        ),
        React.createElement('button', {
            onClick: generatePdf,
            disabled: !ready || generating,
            className: 'w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition'
        }, generating ? 'Generating...' : 'Generate & Download PDF'),
        genProgress && React.createElement('p', { className: 'text-sm text-gray-400 text-center' }, genProgress),
        !hasPdf && React.createElement('p', { className: 'text-xs text-yellow-400 text-center' }, 'Upload a PDF first'),
        hasPdf && fields.length === 0 && React.createElement('p', { className: 'text-xs text-yellow-400 text-center' }, 'Add at least one field')
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
