const { useState, useEffect, useMemo } = React;

// --- Embedded Icons to prevent external script errors ---
const IconCalculator = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
);
const IconRefresh = ({size=16}) => (
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);
const IconTrash = ({size=16}) => (
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const IconCheckCircle = ({className}) => (
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const IconAlertTriangle = ({className}) => (
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
);
const IconXCircle = ({className}) => (
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const IconShoppingBag = ({size=10}) => (
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const IconTarget = ({size=10}) => (
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);

// --- Default Data ---
const DEFAULT_PRIZES = [
{ id: '1', name: 'Prize A', total: 2, left: 2, marketPrice: 4500, type: 'top' },
{ id: '2', name: 'Prize B', total: 8, left: 8, marketPrice: 5000, type: 'top' },
{ id: '3', name: 'Prize C', total: 16, left: 16, marketPrice: 1800, type: 'mid' },
{ id: '4', name: 'Prize D', total: 16, left: 16, marketPrice: 600, type: 'low' },
{ id: '5', name: 'Prize E', total: 32, left: 32, marketPrice: 500, type: 'low' },
];

const App = () => {
// --- State Management ---
const [ticketPrice, setTicketPrice] = useState(790);
const [lastOnePrice, setLastOnePrice] = useState(6000);
const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
const [isLoaded, setIsLoaded] = useState(false);

// --- Persistence ---
useEffect(() => {
    const savedData = localStorage.getItem('kuji_calc_data_v1');
    if (savedData) {
    try {
        const parsed = JSON.parse(savedData);
        setTicketPrice(parsed.ticketPrice || 790);
        setLastOnePrice(parsed.lastOnePrice || 6000);
        setPrizes(parsed.prizes || DEFAULT_PRIZES);
    } catch (e) {
        console.error("Failed to load save data", e);
    }
    }
    setIsLoaded(true);
}, []);

useEffect(() => {
    if (isLoaded) {
    localStorage.setItem('kuji_calc_data_v1', JSON.stringify({ ticketPrice, lastOnePrice, prizes }));
    }
}, [ticketPrice, lastOnePrice, prizes, isLoaded]);

// --- Handlers ---
const updatePrize = (id, field, value) => {
    setPrizes(prev => prev.map(p => {
    if (p.id !== id) return p;
    let cleanValue = value;
    if (field === 'total' || field === 'left' || field === 'marketPrice') {
        cleanValue = parseInt(value) || 0;
    }

    // Logic: If updating Total, Left must follow if it's currently equal, OR clamp it
    if (field === 'total') {
        // If left was previously full, keep it full? Or just clamp?
        // Simple clamp: Left cannot be > Total
        if (p.left > cleanValue) {
        return { ...p, [field]: cleanValue, left: cleanValue };
        }
    }

    // Logic: If updating Left, it cannot exceed Total
    if (field === 'left' && cleanValue > p.total) {
        return { ...p, [field]: p.total };
    }

    return { ...p, [field]: cleanValue };
    }));
};

const resetCounts = () => {
    if(confirm("Reset all 'Left' counts to match 'Total' counts?")) {
    setPrizes(prev => prev.map(p => ({ ...p, left: p.total })));
    }
};

const resetAll = () => {
    if(confirm("Factory Reset? This will clear all custom prices and settings.")) {
    setPrizes(DEFAULT_PRIZES);
    setTicketPrice(790);
    setLastOnePrice(6000);
    }
}

// --- Calculations ---
const stats = useMemo(() => {
    const totalTicketsInBox = prizes.reduce((acc, p) => acc + p.total, 0);
    const totalTicketsLeft = prizes.reduce((acc, p) => acc + p.left, 0);
    const costToClear = totalTicketsLeft * ticketPrice;

    // Value of items remaining based on market price
    const lootValue = prizes.reduce((acc, p) => acc + (p.left * p.marketPrice), 0);
    const totalLootValue = lootValue + (totalTicketsLeft > 0 ? lastOnePrice : 0);

    const profit = totalLootValue - costToClear;

    // Top Prizes (A/B) Remaining
    const topPrizesLeft = prizes.filter(p => p.type === 'top').reduce((acc, p) => acc + p.left, 0);

    return { totalTicketsInBox, totalTicketsLeft, costToClear, lootValue, totalLootValue, profit, topPrizesLeft };
}, [prizes, ticketPrice, lastOnePrice]);

// --- Sniping Logic (Traffic Light) ---
const getSnipeStatus = () => {
    const { totalTicketsLeft, profit, topPrizesLeft, costToClear } = stats;

    if (totalTicketsLeft === 0) return {
    color: 'bg-gray-200',
    text: 'SOLD OUT',
    icon: null
    };

    // GREEN ZONE: Less than 12 tickets OR Profitable
    if (totalTicketsLeft <= 12 || profit > 0) {
    return {
        color: 'bg-green-100 border-green-500 text-green-800',
        text: 'BUY ALL (Green Light)',
        desc: profit > 0 ? 'Profitable immediately!' : 'Low risk zone.',
        icon: <IconCheckCircle className="w-8 h-8 text-green-600" />
    };
    }

    // YELLOW ZONE: 13-20 tickets
    if (totalTicketsLeft <= 20) {
    if (topPrizesLeft > 0) {
        return {
        color: 'bg-yellow-100 border-yellow-500 text-yellow-800',
        text: 'CAUTION (Yellow Light)',
        desc: 'Buy only because Top Prize remains.',
        icon: <IconAlertTriangle className="w-8 h-8 text-yellow-600" />
        };
    } else {
        return {
        color: 'bg-red-100 border-red-500 text-red-800',
        text: 'PASS (Red Light)',
        desc: 'Only 13-20 left, but no top prizes.',
        icon: <IconXCircle className="w-8 h-8 text-red-600" />
        };
    }
    }

    // RED ZONE: 21+ tickets
    return {
    color: 'bg-red-100 border-red-500 text-red-800',
    text: 'PASS (Red Light)',
    desc: 'Too many tickets remaining.',
    icon: <IconXCircle className="w-8 h-8 text-red-600" />
    };
};

const snipeStatus = getSnipeStatus();

return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <IconCalculator /> Kuji Strategist
        </h1>
        <p className="text-gray-500 text-sm">Ichiban Kuji Expected Value & Sniping Calculator</p>
        </div>
        <div className="flex gap-2">
        <button onClick={resetCounts} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors">
            <IconRefresh size={16} /> Reset Counts
        </button>
        <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium shadow-sm transition-colors">
            <IconTrash size={16} /> Factory Reset
        </button>
        </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Configuration & Setup */}
        <div className="lg:col-span-2 space-y-6">
        {/* Global Settings */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 flex flex-wrap gap-6 items-center">
            <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ticket Price (¥)</label>
            <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(parseInt(e.target.value) || 0)} className="w-full text-2xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-1 transition-colors" />
            </div>
            <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last One Market Value (¥)</label>
            <input type="number" value={lastOnePrice} onChange={(e) => setLastOnePrice(parseInt(e.target.value) || 0)} className="w-full text-2xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-purple-500 outline-none py-1 transition-colors" />
            </div>
        </div>

        {/* Prize Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Rank</th>
                    <th className="p-4 w-24">Type</th>
                    <th className="p-4 text-center">Total Box</th>
                    <th className="p-4 text-center bg-blue-50/50 border-x border-blue-100 text-blue-800">Left (Store)</th>
                    <th className="p-4 text-right">Market (¥)</th>
                    <th className="p-4 text-right">Exp. Cost (¥)</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {prizes.map((prize) => {
                    const probability = prize.total > 0 ? (prize.total / stats.totalTicketsInBox) : 0;
                    const expectedCost = probability > 0 ? (ticketPrice / probability) : 0;
                    const isCheaperToBuy = prize.marketPrice < expectedCost;
                    const remainingPercent = prize.total > 0 ? (prize.left / prize.total) * 100 : 0;

                    return (
                    <tr key={prize.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4 font-bold text-gray-700">
                        <input type="text" value={prize.name} onChange={(e) => updatePrize(prize.id, 'name', e.target.value)} className="bg-transparent border-none focus:ring-0 w-full font-bold p-0" />
                        </td>
                        <td className="p-4">
                        <select value={prize.type} onChange={(e) => updatePrize(prize.id, 'type', e.target.value)} className="text-xs rounded-full px-2 py-1 bg-gray-100 border-none cursor-pointer focus:ring-2 focus:ring-blue-200" >
                            <option value="top">Top</option>
                            <option value="mid">Mid</option>
                            <option value="low">Low</option>
                        </select>
                        </td>
                        <td className="p-4 text-center text-gray-400">
                        <input type="number" value={prize.total} onChange={(e) => updatePrize(prize.id, 'total', e.target.value)} className="w-12 text-center bg-transparent border-b border-dashed border-gray-300 focus:border-gray-500 outline-none" />
                        </td>
                        <td className="p-4 text-center bg-blue-50/30 border-x border-blue-50">
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updatePrize(prize.id, 'left', Math.max(0, prize.left - 1))} className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center text-lg leading-none select-none" >-</button>
                            <span className={`font-bold text-lg w-6 ${prize.left === 0 ? 'text-gray-300' : 'text-blue-600'}`}>
                            {prize.left}
                            </span>
                            <button onClick={() => updatePrize(prize.id, 'left', Math.min(prize.total, prize.left + 1))} className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center text-lg leading-none select-none" >+</button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div className={`h-1 rounded-full ${remainingPercent < 20 ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${remainingPercent}%` }} ></div>
                        </div>
                        </td>
                        <td className="p-4 text-right">
                        <input type="number" value={prize.marketPrice} onChange={(e) => updatePrize(prize.id, 'marketPrice', e.target.value)} className="w-20 text-right bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none" />
                        </td>
                        <td className="p-4 text-right">
                        <div className="text-sm font-medium text-gray-800">
                            ¥{Math.round(expectedCost).toLocaleString()}
                        </div>
                        {isCheaperToBuy && (
                            <div className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1">
                            <IconShoppingBag size={10} /> BUY SINGLE
                            </div>
                        )}
                        {!isCheaperToBuy && (
                            <div className="text-[10px] text-red-500 font-bold flex items-center justify-end gap-1">
                            <IconTarget size={10} /> PULL IT
                            </div>
                        )}
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
            <button onClick={() => setPrizes([...prizes, { id: Date.now().toString(), name: 'New Prize', total: 1, left: 1, marketPrice: 1000, type: 'mid' }])} className="text-sm text-blue-600 hover:text-blue-800 font-medium" >
                + Add Prize Row
            </button>
            </div>
        </div>
        </div>

        {/* RIGHT COLUMN: Analysis Dashboard */}
        <div className="space-y-6">
        {/* Sniping Traffic Light */}
        <div className={`rounded-xl border-2 p-6 shadow-sm transition-all ${snipeStatus.color}`}>
            <div className="flex items-start justify-between">
            <div>
            <h2 className="text-lg font-bold uppercase tracking-wider mb-1">Sniping Advice</h2>
            <p className="text-3xl font-black mb-2 leading-tight">{snipeStatus.text}</p>
            <p className="text-sm opacity-90 font-medium">{snipeStatus.desc}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
            {snipeStatus.icon}
            </div>
            </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2">Full Buy Analysis</h3>
            <div className="flex justify-between items-end">
            <span className="text-gray-600 text-sm">Tickets Remaining</span>
            <span className="text-2xl font-bold text-gray-800">{stats.totalTicketsLeft} <span className="text-sm font-normal text-gray-400">/ {stats.totalTicketsInBox}</span></span>
            </div>
            <div className="flex justify-between items-end">
            <span className="text-gray-600 text-sm">Cost to Clear</span>
            <span className="text-xl font-bold text-red-600">- ¥{stats.costToClear.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end">
            <span className="text-gray-600 text-sm">Resale Value (Loot + Last One)</span>
            <span className="text-xl font-bold text-green-600">+ ¥{stats.totalLootValue.toLocaleString()}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-end">
            <span className="text-gray-800 font-bold">Net Profit / Loss</span>
            <span className={`text-2xl font-black ${stats.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.profit > 0 ? '+' : ''}¥{stats.profit.toLocaleString()}
            </span>
            </div>
        </div>

        {/* Probabilities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2">Live Odds</h3>
            <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Any Top Prize (A/B)</span>
                <span className="font-mono font-bold text-blue-600">
                {stats.totalTicketsLeft > 0 ? ((stats.topPrizesLeft / stats.totalTicketsLeft) * 100).toFixed(2) : 0}%
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next Pull Cost</span>
                <span className="font-mono font-bold text-gray-800">¥{ticketPrice}</span>
            </div>
            <div className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded">
                Tip: If "Any Top Prize" odds are &gt; 15%, it's usually a hot box.
            </div>
            </div>
        </div>
        </div>
    </div>
    </div>
);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
