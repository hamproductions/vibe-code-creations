// UI strings (EN / 日本語). Chant content has its own script toggle (kana / romaji / both).
const D = {
  en: {
    codex: 'Codex', practice: 'Practice', stats: 'Stats', settings: 'Settings',
    search: 'Search (romaji, kana or English)…', all: 'All',
    tier1: 'Essential', tier2: 'Common', tier3: 'Deep Cuts',
    tier1d: 'Learn these first — they cover most floors.', tier2d: "You'll hear these every week.", tier3d: 'Gags, themes, rare languages and group originals.',
    Basic: 'Basic', 'Language Variant': 'Language', Advanced: 'Advanced', Koujou: 'Koujou', Theme: 'Theme',
    NOT_LEARNED: 'Locked', LEARNING: 'Learning', REMEMBERED: 'Remembered', MASTERED: 'Mastered',
    bars: '{n} bars', words: '{n} words', locked: 'Locked', unlockStudy: 'Unlock & study', studyNow: 'Study',
    practiceThis: 'Practice this mix', tapBank: 'Tap Bank', rhythm: 'Rhythm', mixed: 'Mixed',
    due: 'Due', newCards: 'New', mastered: 'Mastered', collected: 'Collected',
    startSession: 'Start session', nothingDue: 'Nothing due right now. Nice! Unlock more from the Codex or practise any mix.',
    mode: 'Input mode', speed: 'Baisoku (speed)', off: 'Off', auto: 'Auto', tempo: 'Tempo (BPM)',
    modeHelp: 'Tap Bank: build the chant from a shuffled bank. Rhythm: tap the right word on the beat.',
    speedHelp: 'Baisoku runs the chant at 2× / 4× speed. Auto ramps up advanced mixes as your streak grows.',
    ready: "I've got it — test me", reveal: 'Reveal', next: 'Next', finish: 'Finish', quit: 'End session', hint: 'Hint',
    study: 'Study', studyHint: 'Read it, say it out loud with the beat, then start the test.',
    initiator: 'Start call', trigger: 'When it hits', timing: 'Length', notes: 'Notes',
    extension: 'Optional ending', category: 'Category', tier: 'Priority',
    perfect: 'PERFECT', good: 'GOOD', ok: 'OK', miss: 'MISS', wrong: 'WRONG', early: 'early', late: 'late',
    grade: 'Grade', accuracy: 'Accuracy', time: 'Time', errors: 'Mistakes', nextReview: 'Next review',
    minutes10: '10 min', day: 'day', days: 'days', timeUp: "Time's up!", complete: 'Complete!',
    sessionDone: 'Session complete', avgGrade: 'Average grade', reviewed: 'Reviewed', again: 'Again',
    countIn: 'Count-in…', go: 'GO!', tapStart: 'Tap anywhere in the bank to begin — the clock starts on your first tap.',
    gradeNames0: 'Blank', gradeNames1: 'Barely', gradeNames2: 'Shaky', gradeNames3: 'Okay', gradeNames4: 'Solid', gradeNames5: 'Perfect',
    totalReviews: 'Total reviews', avgAcc: 'Avg grade', streakDays: 'Day streak', reviewsLast14: 'Reviews · last 14 days', weakest: 'Needs work',
    noReviews: 'No reviews yet — start a session!',
    language: 'Language', chantScript: 'Chant script', scriptJp: 'Kana', scriptRomaji: 'Romaji', scriptBoth: 'Both',
    oshi: 'Oshi name', oshiHelp: 'Replaces ○○ in koujou lines.', newPerDay: 'New mixes per day', includeExt: 'Include optional endings',
    sound: 'Sound', haptics: 'Vibration', latency: 'Tap latency offset (ms)', revealLocked: 'Show names of locked mixes',
    backup: 'Backup', exportData: 'Export backup', importData: 'Import backup', reset: 'Reset all progress', resetConfirm: 'Erase all progress and custom mixes?',
    addMix: 'Add custom mix', editMix: 'Edit mix', deleteMix: 'Delete', save: 'Save', cancel: 'Cancel', close: 'Close',
    mixName: 'Name', mixJp: 'Japanese name', mixTiming: 'Bars', mixTrigger: 'When it hits', mixChant: 'Chant',
    chantHelp: 'One phrase per line, blank line between stanzas. [brackets] = optional ending, 虎×4 repeats, (クラップ) = clap.',
    romajiInput: 'Type romaji → kana (WanaKana)', saved: 'Saved', imported: 'Backup imported', exported: 'Backup downloaded',
    offline: 'Works offline', installHint: 'Install this app from your browser menu for the venue.', storageMem: 'Storage blocked — progress will not persist.',
    unlocked: 'Unlocked!', masteredToast: 'MASTERED — foil card earned ✨', count: '{a} / {b}',
    yourSeq: 'Your chant', bankTitle: 'Word bank', pickRight: 'Pick the right word on the beat',
    sortLearn: 'Learning order', sortName: 'Name', sortDue: 'Due soon', sortStatus: 'Progress',
    empty: 'No mixes match.', reviewsDone: '{n} reviewed', studyLeft: '{n} left',
    custom: 'Custom', baisokuTag: 'Baisoku', dragHint: '',
  },
  ja: {
    codex: '図鑑', practice: '練習', stats: '成績', settings: '設定',
    search: '検索（ローマ字・かな・英語）…', all: 'すべて',
    tier1: '必修', tier2: '定番', tier3: 'マニア',
    tier1d: 'まずはここから。ほとんどの現場をカバー。', tier2d: '毎週のように耳にするMIX。', tier3d: 'ネタ・テーマ・珍しい言語・グループ固有。',
    Basic: '基本', 'Language Variant': '言語', Advanced: '上級', Koujou: '口上', Theme: 'ネタ',
    NOT_LEARNED: '未習得', LEARNING: '学習中', REMEMBERED: '記憶済み', MASTERED: 'マスター',
    bars: '{n}小節', words: '{n}語', locked: 'ロック中', unlockStudy: '解放して学ぶ', studyNow: '学ぶ',
    practiceThis: 'このMIXを練習', tapBank: 'タップバンク', rhythm: 'リズム', mixed: 'ミックス',
    due: '復習', newCards: '新規', mastered: 'マスター', collected: '収集',
    startSession: 'セッション開始', nothingDue: '今は復習なし。図鑑で新しいMIXを解放するか、好きなMIXを練習しよう。',
    mode: '入力モード', speed: '倍速', off: 'なし', auto: 'オート', tempo: 'テンポ (BPM)',
    modeHelp: 'タップバンク：シャッフルされた言葉から並べる。リズム：拍に合わせて正しい言葉をタップ。',
    speedHelp: '倍速は2倍・4倍速で打ちます。オートは連続正解に応じて上級MIXを加速。',
    ready: '覚えた！テスト開始', reveal: '表示', next: '次へ', finish: '終了', quit: 'セッション終了', hint: 'ヒント',
    study: '学習', studyHint: '声に出して拍に合わせて読んでから、テストを始めよう。',
    initiator: '発動の合図', trigger: '入るタイミング', timing: '尺', notes: 'メモ',
    extension: '追加エンディング', category: 'カテゴリ', tier: '優先度',
    perfect: 'PERFECT', good: 'GOOD', ok: 'OK', miss: 'MISS', wrong: 'ミス', early: '早い', late: '遅い',
    grade: '評価', accuracy: '正確さ', time: 'タイム', errors: 'ミス数', nextReview: '次の復習',
    minutes10: '10分後', day: '日後', days: '日後', timeUp: 'タイムアップ！', complete: 'クリア！',
    sessionDone: 'セッション完了', avgGrade: '平均評価', reviewed: '復習済み', again: 'もう一度',
    countIn: 'カウントイン…', go: 'GO！', tapStart: 'バンクの言葉をタップして開始 — 最初のタップで計測スタート。',
    gradeNames0: '白紙', gradeNames1: 'うろ覚え', gradeNames2: '不安', gradeNames3: 'まずまず', gradeNames4: '良好', gradeNames5: '完璧',
    totalReviews: '総復習数', avgAcc: '平均評価', streakDays: '連続日数', reviewsLast14: '復習数 · 直近14日', weakest: '要練習',
    noReviews: 'まだ復習がありません。セッションを始めよう！',
    language: '言語', chantScript: 'コールの表記', scriptJp: 'かな', scriptRomaji: 'ローマ字', scriptBoth: '両方',
    oshi: '推しの名前', oshiHelp: '口上の○○に入ります。', newPerDay: '1日の新規MIX数', includeExt: '追加エンディングも含める',
    sound: '効果音', haptics: 'バイブ', latency: 'タップ遅延補正 (ms)', revealLocked: 'ロック中のMIX名を表示',
    backup: 'バックアップ', exportData: 'バックアップを書き出す', importData: 'バックアップを読み込む', reset: '進捗をすべてリセット', resetConfirm: '進捗とカスタムMIXをすべて消去しますか？',
    addMix: 'カスタムMIXを追加', editMix: 'MIXを編集', deleteMix: '削除', save: '保存', cancel: 'キャンセル', close: '閉じる',
    mixName: '名前', mixJp: '日本語名', mixTiming: '小節数', mixTrigger: '入るタイミング', mixChant: 'コール',
    chantHelp: '1行1フレーズ、連の間は空行。[ ]＝追加エンディング、虎×4＝繰り返し、(クラップ)＝手拍子。',
    romajiInput: 'ローマ字→かな変換 (WanaKana)', saved: '保存しました', imported: '読み込みました', exported: '書き出しました',
    offline: 'オフライン対応', installHint: '会場で使うにはブラウザのメニューからインストール。', storageMem: 'ストレージが使えないため進捗は保存されません。',
    unlocked: '解放！', masteredToast: 'マスター達成 — ホイルカード獲得 ✨', count: '{a} / {b}',
    yourSeq: 'あなたのコール', bankTitle: '言葉バンク', pickRight: '拍に合わせて正しい言葉を選ぼう',
    sortLearn: '学習順', sortName: '名前', sortDue: '復習が近い順', sortStatus: '進捗',
    empty: '該当なし', reviewsDone: '{n}件完了', studyLeft: '残り{n}',
    custom: 'カスタム', baisokuTag: '倍速', dragHint: '',
  },
};

const TRIGGER_JA = [
  [/First Instrumental Intro/i, '最初の前奏'], [/Song start/i, '曲の冒頭'], [/Second Interlude \(before verse 2\)/i, '2番前の間奏'], [/Second interlude/i, '2番前の間奏'],
  [/Long interlude between verse 1 and 2/i, '1番2番間の長い間奏'], [/Long interlude/i, '長い間奏'], [/Longest interlude/i, '最長の間奏'], [/Long outro/i, '長いアウトロ'],
  [/Outro \(Ending\)/i, 'アウトロ'], [/Outro \(short instrumental\)/i, '短いアウトロ'], [/Extended Outro/i, '長いアウトロ'], [/Outro/i, 'アウトロ'],
  [/Emotional Interlude/i, 'エモい間奏'], [/Ochisabi/i, '落ちサビ'], [/Heavy metal or electronic drop/i, 'ヘビーな落ち'], [/Interlude after verse 2/i, '2番後の間奏'],
  [/2nd Verse \/ A-Melody/i, '2番Aメロ'], [/Bridge/i, 'ブリッジ'], [/Short gap/i, '短い間'], [/Interlude/i, '間奏'], [/Encore/i, 'アンコール'], [/Drop/i, '落ち'],
  [/Finale/i, 'フィナーレ'], [/Group original/i, 'グループ固有'], [/Gag outro/i, 'ネタのアウトロ'], [/Gag/i, 'ネタ'], [/After chorus/i, 'サビ後'],
  [/Right before the Standard MIX[^·]*/i, 'スタンダードMIXの直前'], [/Chained into 3-ren/i, '3連につなぐ'], [/Pre-MIX/i, 'MIX前'], [/Short interlude or outro/i, '短い間奏かアウトロ'],
  [/Second verse A-melody/i, '2番Aメロ'], [/after the forward Konton/i, '正順の後'],
];
export function trTrigger(s, lang) {
  if (lang !== 'ja' || !s) return s;
  let out = s;
  for (const [re, ja] of TRIGGER_JA) out = out.replace(re, ja);
  return out;
}

let lang = 'en';
export const setLang = l => { lang = D[l] ? l : 'en'; document.documentElement.lang = lang; };
export const getLang = () => lang;
export function t(key, vars) {
  let s = D[lang]?.[key] ?? D.en[key] ?? key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
