# Current task

## Scope and permissions
MIXDEX combines a searchable source-backed catalog with practical learning. Original source audit is complete. Historical Goal is complete; subsequent UI fixes and practice modes are ordinary authorized implementation work, not a new Goal.
Local code/data edits, isolated browser QA, and project-local server are authorized. Current authorization incorporates all existing local work into main, including evidence and the sibling trainer edit. No push, deployment, PR, external messages, production writes, or system/audio changes. Preserve unrelated ../bld-memo-trainer/index.html and earlier dirty files. No new test files.

## Required product behavior
- Browse and Learn are equal routes, with contextual MIX onboarding.
- Preserve source rows and explicit spaces for ordinary/Koujou chants. Keep intentionally fused Kahen phrases and embedded claps intact. Optional endings and separate source versions remain distinct.
- Search and manual progress controls support new, learning, learned, mastered. Progress uses prominent labeled badges. Preserve accepted mastered foil and thin borders; never add thick status strips.
- Learn exposes all eligible MIX through search, status/category/tier filters and explicit multi-selection. Selection survives search/filter changes. Mobile practice action remains accessible while scrolling.
- Learn defaults and resets to Learning. Other filters remain available for choosing new or mastered MIX.
- Practice exactly the selected MIX. Due-review sessions remain finite. No automatic extra MIX or failed-card retries; results stay visible and retry requires an explicit action.
- Before practice, choose multiple choice, line flashcards, or full-chant recall. Both new modes were explicitly selected by the user.
- Multiple choice defaults to 3 questions per selected MIX, configurable to 1/3/5. Ask for actual source lines using preceding-line context. Choices are unique real chant lines, not invented distractors; provide immediate correct/incorrect feedback and an explicit next/finish button.
- Line flashcards follow every source row in order, conceal the current line, reveal it, then accept remembered/forgotten before advancing.
- Full-chant recall retains study/hide/reveal/ordered self-assessment. Partial line practice does not automatically change existing full-chant status. New practiced MIX become Learning. Completed exercises update the review schedule and save progress/reviews atomically.
- Japanese chant views have no pronunciation or Romanized title subtitles. UI, notes and source labels are localized. 跳 reads Chou in English reading mode.
- Concise performance guidance belongs in Learn; transcription comparisons belong in a labeled Browse disclosure.
- Backup import/export covers settings, progress, reviews and custom MIX. Validate before writing, merge atomically, avoid duplicate review restores. Exact-MIX deep links include language; QR generation is local.

## Sources and durable rules
Closed references: http://www.masakimch.be/; https://xn--nzwp98desh.com/mix-ranking/ and mapped relevant articles; https://seesaawiki.jp/idoljapan2010/d/MIX; https://note.com/sho_20000728/n/nd419f385d988; https://ameblo.jp/archangel-neo/entry-12881375852.html.
All 135 catalog records were reconciled. Source differences/uncertainty: conductor/data-source-audit.md. Saved MCH: conductor/sources/masakimch.html. Hayashi remains source-pending and unavailable for practice. Tanbo excerpts use their full parent chant for learning. Do not reopen completed source research.
Product rules are in AGENTS.md. Seed v49; SW v83. QR library: vendor/qrcodegen.mjs (Nayuki v1.8.0, license retained). Catalog translations: src/catalogJa.js.

## Current implementation and remaining action
New modes implemented in src/practice.js and src/engine.js. Atomic result save in src/db.js. Labels in src/i18n.js, rendering in src/ui.js and style.css. Online SW fetch bypasses HTTP cache with offline fallback to avoid mismatched cached module exports.
Local changes restored onto latest main; README, app routing and SW conflicts resolved. Existing engine, seed and roundtrip checks pass. Current modes were previously verified on SW v83. Final finish button reads クイズを終了; fresh mode selector and Learning default inspected. Live headed app is left on Learn with selectable modes. All local work incorporated on main, including source audit, evidence and sibling trainer edit. Existing engine, seed, roundtrip and app syntax checks pass. Integrated Standard hash route rendered and screenshot inspected; full browser regression was not repeated. No push or release authorized.

## Verified evidence
- Final existing engine/integrity/roundtrip checks pass with concurrency 1. All source-row line cards preserve their rows, and every multiple-choice option is a unique real corpus line; limits verified across eligible catalog.
- Desktop Ainu-Nichi multiple choice: deliberate wrong answer followed by two correct answers; result 2/3 and no extra questions. screenshots/mode-multiple-choice.png, mode-wrong-answer.png, mode-choice-results.png inspected.
- Standard line flashcards: four rows, first forgotten then three remembered; result 3/4 and no automatic retry. screenshots/mode-line-hidden.png, mode-line-revealed.png, mode-lines-results.png inspected.
- Existing full-chant mode: Standard hidden recall/reveal/rating reaches results. New Standard became Learning after line practice and only became Learned after full-chant self-rating.
- 390px Kahen multiple choice and line flashcard: fused text/clap preserved in single tokens, no horizontal overflow. screenshots/mode-choice-mobile-kahen.png and mode-line-mobile-kahen.png inspected.
- Mobile one-question MC on current code: correct answer explicitly labeled, final button クイズを終了, result 1/1. Completed Ainu review no longer immediately due; Learning status persists after reload. screenshots/mode-choice-mobile-feedback.png and mode-mobile-one-question-results.png inspected.
- Mixed Japanese/English name search now matches literal text before kana normalization; 可変3連MIX finds the actual record. Mode switching preserves selected MIX.
- Historical browser error list retains one initial stale engine-export error; resolved cache path and repeated fresh flows add no new error. Console is empty. Do not misreport the historical list as empty.
- Prior UX proof: dogfood-output/status-selection-report.md; exact two-MIX selection, mobile one-card completion, prominent status badges, filter reset, centered badge.
- Prior backup UI roundtrip preserved custom chant rows/optional ending and review history; invalid import changed no data; repeated restores did not duplicate reviews. Test custom MIX removed.
- QR decoded in the actual browser to the exact direct URL. Localhost QR requires access to this local server.

## Browser and process ownership
Live server handle 27506 at http://localhost:4176/. One headed task session: mixdex-kahen-audit. Keep live for explicitly requested inspection; unrelated avatar-viewer and holypeak-archive untouched. Prefix every browser command with AGENT_BROWSER_ARGS="--use-mock-keychain,--password-store=basic,--mute-audio" and --session mixdex-kahen-audit. Never navigate non-HTTP links. List sessions before/after; close only owned sessions if ending the requested live view. No passive sleep/poll loops.
Browser clicks do not scroll automatically. Inspect state after interaction; use explicit scroll or focus/Enter. Recording recreates the isolated context, so account for onboarding and fresh local state. Do not record additional contexts unnecessarily.

## Skill gates
Previously fully read and executed in this task: using-superpowers, get-your-shit-together (1–27), what-did-i-say (1–98), stop-inventing, look-at-the-screen, unfuck-yourself, brainstorming, design/UX skills, real-testing-evidence, agent-browser core/references, systematic-debugging, verification-before-completion. See verified evidence above; do not reread by ceremony.
Current explicit dogfood gate: SKILL 1–224, taxonomy 1–109, template 1–53 EOF; report and before/after evidence completed. show-me 1–93 EOF; live surface retained. Grilling 1–28 EOF; the only material mode decision was resolved by the explicit answer selecting both new modes. Current-session corrections and all supplied screenshots reconciled; no prior-session history read.
