const { useState, useEffect, useMemo, useRef } = React;

const Search = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
const CheckCircle2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
const XCircle = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const AlertCircle = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
);
const RotateCcw = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);
const BookOpen = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const Gamepad2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="15.5" cy="10.5" r=".5"/><circle cx="17.5" cy="12.5" r=".5"/></svg>
);

const KANJI_DATA = [
  { kanji: '鯏', kana: 'あさり', romaji: ['asari'], meaning: 'Littleneck clam' },
  { kanji: '鯵', kana: 'あじ', romaji: ['aji', 'azi'], meaning: 'Horse mackerel' },
  { kanji: '鮎', kana: 'あゆ', romaji: ['ayu'], meaning: 'Sweetfish' },
  { kanji: '鯇', kana: 'ひがい', romaji: ['higai', 'sougyo'], meaning: 'Grass carp' },
  { kanji: '鮑', kana: 'あわび', romaji: ['awabi'], meaning: 'Abalone' },
  { kanji: '魦', kana: 'いさざ', romaji: ['isaza'], meaning: 'Isaza goby' },
  { kanji: '鯔', kana: 'ぼら', romaji: ['bora'], meaning: 'Mullet' },
  { kanji: '鯆', kana: 'いるか', romaji: ['iruka'], meaning: 'Dolphin' },
  { kanji: '鰯', kana: 'いわし', romaji: ['iwashi', 'iwasi'], meaning: 'Sardine' },
  { kanji: '鮇', kana: 'いわな', romaji: ['iwana'], meaning: 'Char' },
  { kanji: '鯎', kana: 'うぐい', romaji: ['ugui'], meaning: 'Dace' },
  { kanji: '鱓', kana: 'うつぼ', romaji: ['utsubo', 'utubo'], meaning: 'Moray eel' },
  { kanji: '鰻', kana: 'うなぎ', romaji: ['unagi'], meaning: 'Eel' },
  { kanji: '鱏', kana: 'えい', romaji: ['ei'], meaning: 'Ray/Skate' },
  { kanji: '鱛', kana: 'えそ', romaji: ['eso'], meaning: 'Lizardfish' },
  { kanji: '鰕', kana: 'えび', romaji: ['ebi'], meaning: 'Shrimp' },
  { kanji: '鰧', kana: 'おこぜ', romaji: ['okoze'], meaning: 'Stonefish' },
  { kanji: '鰍', kana: 'かじか', romaji: ['kajika', 'kazika'], meaning: 'Sculpin' },
  { kanji: '鰹', kana: 'かつお', romaji: ['katsuo', 'katuo'], meaning: 'Bonito' },
  { kanji: '鱟', kana: 'かぶとがに', romaji: ['kabutogani'], meaning: 'Horseshoe crab' },
  { kanji: '魳', kana: 'かます', romaji: ['kamasu'], meaning: 'Barracuda' },
  { kanji: '鰈', kana: 'かれい', romaji: ['karei'], meaning: 'Flounder' },
  { kanji: '鮍', kana: 'かわはぎ', romaji: ['kawahagi'], meaning: 'Filefish' },
  { kanji: '鱚', kana: 'きす', romaji: ['kisu'], meaning: 'Sillago' },
  { kanji: '鯨', kana: 'くじら', romaji: ['kujira', 'kuzira'], meaning: 'Whale' },
  { kanji: '鯉', kana: 'こい', romaji: ['koi'], meaning: 'Carp' },
  { kanji: '鯒', kana: 'こち', romaji: ['kochi', 'koti'], meaning: 'Flathead' },
  { kanji: '鮗', kana: 'このしろ', romaji: ['konoshiro', 'konosiro'], meaning: 'Gizzard shad' },
  { kanji: '鮴', kana: 'ごり', romaji: ['gori', 'mebaru'], meaning: 'Goby/Rockfish' },
  { kanji: '鮭', kana: 'さけ', romaji: ['sake', 'shake'], meaning: 'Salmon' },
  { kanji: '鯯', kana: 'さっぱ', romaji: ['sappa'], meaning: 'Japanese shad' },
  { kanji: '鯖', kana: 'さば', romaji: ['saba'], meaning: 'Mackerel' },
  { kanji: '鮫', kana: 'さめ', romaji: ['same'], meaning: 'Shark' },
  { kanji: '鱵', kana: 'さより', romaji: ['sayori'], meaning: 'Halfbeak' },
  { kanji: '鰆', kana: 'さわら', romaji: ['sawara'], meaning: 'Spanish mackerel' },
  { kanji: '鯢', kana: 'さんしょううお', romaji: ['sanshouuo', 'sanshouo', 'sansyouuo'], meaning: 'Salamander' },
  { kanji: '鱪', kana: 'しいら', romaji: ['shiira', 'siira'], meaning: 'Mahi-mahi' },
  { kanji: '鯱', kana: 'しゃち', romaji: ['shachi', 'syachi', 'shati', 'syati'], meaning: 'Orca' },
  { kanji: '鮊', kana: 'しらうお', romaji: ['shirauo', 'sirauo'], meaning: 'Icefish' },
  { kanji: '鯳', kana: 'すけそうだら', romaji: ['sukesoudara'], meaning: 'Alaska pollock' },
  { kanji: '鱸', kana: 'すずき', romaji: ['suzuki'], meaning: 'Sea bass' },
  { kanji: '鯐', kana: 'すばしり', romaji: ['subashiri', 'subasiri'], meaning: 'Young mullet' },
  { kanji: '鮬', kana: 'せいご', romaji: ['seigo'], meaning: 'Young sea bass' },
  { kanji: '鯛', kana: 'たい', romaji: ['tai'], meaning: 'Sea bream' },
  { kanji: '鰖', kana: 'たかべ', romaji: ['takabe'], meaning: 'Yellow-striped butterfish' },
  { kanji: '鰱', kana: 'たなご', romaji: ['tanago', 'hakuren'], meaning: 'Bitterling' },
  { kanji: '鮹', kana: 'たこ', romaji: ['tako'], meaning: 'Octopus' },
  { kanji: '魛', kana: 'たちうお', romaji: ['tachiuo', 'tatiuo'], meaning: 'Cutlassfish' },
  { kanji: '鱈', kana: 'たら', romaji: ['tara'], meaning: 'Cod' },
  { kanji: '鱘', kana: 'ちょうざめ', romaji: ['chouzame', 'tyouzame', 'chozame', 'tyozame'], meaning: 'Sturgeon' },
  { kanji: '鱅', kana: 'こくれん', romaji: ['kokuren'], meaning: 'Bighead carp' },
  { kanji: '鰌', kana: 'どじょう', romaji: ['dojou', 'dojo'], meaning: 'Loach' },
  { kanji: '鯰', kana: 'なまず', romaji: ['namazu'], meaning: 'Catfish' },
  { kanji: '鰊', kana: 'にしん', romaji: ['nishin', 'nisin'], meaning: 'Herring' },
  { kanji: '鮸', kana: 'にべ', romaji: ['nibe'], meaning: 'Croaker' },
  { kanji: '鯊', kana: 'はぜ', romaji: ['haze'], meaning: 'Goby' },
  { kanji: '鰣', kana: 'はす', romaji: ['hasu'], meaning: 'Pale chub' },
  { kanji: '鰰', kana: 'はたはた', romaji: ['hatahata'], meaning: 'Sandfish' },
  { kanji: '魬', kana: 'はまち', romaji: ['hamachi', 'hamati'], meaning: 'Young yellowtail' },
  { kanji: '鱧', kana: 'はも', romaji: ['hamo'], meaning: 'Pike conger' },
  { kanji: '鮠', kana: 'はや', romaji: ['haya'], meaning: 'Minnow' },
  { kanji: '鰚', kana: 'はらか', romaji: ['haraka'], meaning: 'Salmonid' },
  { kanji: '鰉', kana: 'ひがい', romaji: ['higai'], meaning: 'Minnow' },
  { kanji: '鯷', kana: 'ひしこ', romaji: ['hishiko', 'hisiko'], meaning: 'Anchovy' },
  { kanji: '鮃', kana: 'ひらめ', romaji: ['hirame'], meaning: 'Flounder' },
  { kanji: '鰭', kana: 'ひれ', romaji: ['hire'], meaning: 'Fin' },
  { kanji: '鱶', kana: 'ふか', romaji: ['fuka'], meaning: 'Shark' },
  { kanji: '鰒', kana: 'ふぐ', romaji: ['fugu', 'awabi'], meaning: 'Pufferfish' },
  { kanji: '鮒', kana: 'ふな', romaji: ['funa'], meaning: 'Crucian carp' },
  { kanji: '鰤', kana: 'ぶり', romaji: ['buri'], meaning: 'Yellowtail' },
  { kanji: '鮪', kana: 'まぐろ', romaji: ['maguro'], meaning: 'Tuna' },
  { kanji: '鱒', kana: 'ます', romaji: ['masu'], meaning: 'Trout' },
  { kanji: '鮲', kana: 'まごち', romaji: ['magochi', 'magoti', 'kochi', 'koti'], meaning: 'Flathead' },
  { kanji: '鯧', kana: 'まながつお', romaji: ['managatsuo', 'managatuo'], meaning: 'Pomfret' },
  { kanji: '鯥', kana: 'むつ', romaji: ['mutsu', 'mutu'], meaning: 'Gnomefish' },
  { kanji: '鰘', kana: 'むろあじ', romaji: ['muroaji', 'muroazi'], meaning: 'Scad' },
  { kanji: '鰙', kana: 'わかさぎ', romaji: ['wakasagi'], meaning: 'Smelt' },
  { kanji: '鰐', kana: 'わに', romaji: ['wani'], meaning: 'Crocodile' }
];

// Levenshtein distance for fuzzy matching
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const checkAnswer = (input, validAnswers) => {
  const normalizedInput = input.toLowerCase().trim();
  if (normalizedInput === '') return { status: 'empty' };

  if (validAnswers.includes(normalizedInput)) {
    return { status: 'correct' };
  }

  let closestMatch = null;
  let minDistance = Infinity;

  for (const ans of validAnswers) {
    const dist = levenshtein(normalizedInput, ans);
    if (dist < minDistance) {
      minDistance = dist;
      closestMatch = ans;
    }
  }

  // Threshold: 1 typo for short words, 2 for longer ones
  const threshold = closestMatch.length > 4 ? 2 : 1;

  if (minDistance <= threshold && normalizedInput.length > 1) {
    return { status: 'close', suggestion: closestMatch };
  }

  return { status: 'incorrect', suggestion: closestMatch };
};

function App() {
  const [activeTab, setActiveTab] = useState('quiz');

  // Cheatsheet State
  const [searchQuery, setSearchQuery] = useState('');

  // Quiz State
  const [quizQueue, setQuizQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState(null); // { status, message }
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    initQuiz();
  }, []);

  const initQuiz = () => {
    const shuffled = [...KANJI_DATA].sort(() => 0.5 - Math.random());
    setQuizQueue(shuffled);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    resetTurn();
  };

  const resetTurn = () => {
    setInputVal('');
    setFeedback(null);
    setShowAnswer(false);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleNext = () => {
    if (currentIndex < quizQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetTurn();
    } else {
      initQuiz(); // Restart if finished
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showAnswer) {
      handleNext();
      return;
    }

    const currentItem = quizQueue[currentIndex];
    const result = checkAnswer(inputVal, currentItem.romaji);

    if (result.status === 'empty') {
      handleGiveUp();
      return;
    }

    if (result.status === 'correct') {
      setFeedback({ status: 'correct', message: 'Correct!' });
      setScore(s => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
      setShowAnswer(true);
    } else if (result.status === 'close') {
      setFeedback({ status: 'close', message: `Close! Did you mean "${result.suggestion}"?` });
    } else if (result.status === 'incorrect') {
      setFeedback({ status: 'incorrect', message: 'Incorrect.' });
    }
  };

  const handleGiveUp = () => {
    setFeedback({ status: 'incorrect', message: `It was: ${quizQueue[currentIndex].romaji[0]}` });
    setScore(s => ({ ...s, total: s.total + 1 }));
    setShowAnswer(true);
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return KANJI_DATA.filter(item =>
      item.kanji.includes(q) ||
      item.kana.includes(q) ||
      item.meaning.toLowerCase().includes(q) ||
      item.romaji.some(r => r.includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header & Navigation */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marine Kanji Mastery</h1>
            <p className="text-neutral-400">Master the specialized readings of fish and sea life.</p>
          </div>
          <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
            <button
              onClick={() => { setActiveTab('quiz'); setTimeout(() => inputRef.current?.focus(), 10); }}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${activeTab === 'quiz' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Quiz
            </button>
            <button
              onClick={() => setActiveTab('cheatsheet')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${activeTab === 'cheatsheet' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Cheatsheet
            </button>
          </div>
        </header>

        {/* Views */}
        {activeTab === 'quiz' && quizQueue.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-12 shadow-2xl flex flex-col items-center max-w-2xl mx-auto">

            <div className="w-full flex justify-between items-center mb-8 text-neutral-400 font-mono text-sm">
              <span>{currentIndex + 1} / {quizQueue.length}</span>
              <span>Score: {score.correct}/{score.total}</span>
            </div>

            <div className="text-8xl md:text-9xl font-serif text-white mb-8 select-none">
              {quizQueue[currentIndex].kanji}
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center gap-4">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  if (feedback?.status === 'close') setFeedback(null);
                }}
                readOnly={showAnswer}
                placeholder="Type romaji..."
                className="w-full bg-neutral-950 border border-neutral-700 text-center text-xl rounded-xl px-6 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all read-only:opacity-50"
                autoComplete="off"
                spellCheck="false"
              />

              <div className="h-8 flex items-center justify-center w-full">
                {feedback && (
                  <div className={`flex items-center gap-2 font-medium ${
                    feedback.status === 'correct' ? 'text-green-400' :
                    feedback.status === 'close' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {feedback.status === 'correct' && <CheckCircle2 className="w-5 h-5" />}
                    {feedback.status === 'close' && <AlertCircle className="w-5 h-5" />}
                    {feedback.status === 'incorrect' && <XCircle className="w-5 h-5" />}
                    {feedback.message}
                  </div>
                )}
              </div>

              {showAnswer ? (
                <div className="w-full space-y-4">
                  <div className="bg-neutral-950 rounded-lg p-4 text-center border border-neutral-800">
                    <p className="text-2xl font-bold mb-1">{quizQueue[currentIndex].kana}</p>
                    <p className="text-neutral-400">{quizQueue[currentIndex].meaning}</p>
                  </div>
                  <button
                    type="submit"
                    autoFocus
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Next <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              ) : (
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={handleGiveUp}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Show Answer
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Submit
                  </button>
                </div>
              )}
            </form>

            <button onClick={initQuiz} className="mt-8 text-neutral-500 hover:text-neutral-300 flex items-center text-sm transition-colors">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Quiz
            </button>
          </div>
        )}

        {activeTab === 'cheatsheet' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search kanji, romaji, or meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredData.map((item, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center text-center hover:border-neutral-600 transition-colors group">
                  <span className="text-4xl font-serif mb-2 group-hover:scale-110 transition-transform">{item.kanji}</span>
                  <span className="font-bold text-neutral-200">{item.kana}</span>
                  <span className="text-xs text-neutral-500 font-mono mt-1">{item.romaji[0]}</span>
                  <span className="text-sm text-neutral-400 mt-2 border-t border-neutral-800 pt-2 w-full">{item.meaning}</span>
                </div>
              ))}
              {filteredData.length === 0 && (
                <div className="col-span-full py-12 text-center text-neutral-500">
                  No matches found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
