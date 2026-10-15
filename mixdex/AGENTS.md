# MIXDEX product rules

- Keep learning guidance concise and about performing or recalling the chant. Put source transcription comparisons in a labeled disclosure in Browse, never in the learning card.
- Japanese chant text retains source characters and adds furigana in ruby for known kanji readings. English chant text and start calls use romaji regardless of legacy script settings. Japanese shows no romaji subtitles.
- Chant tokenization controls phrase boundaries, not visual styling. Browse and Learn both show bordered tokens and preserve source rows.
- Backup imports validate before writing, merge matching records atomically, and do not duplicate review history.
- Sharing links identify the exact MIX slug and language; generate QR codes locally.
- Learning progress must be readable through prominent text badges, not decorative card borders alone. Learn must expose a searchable full catalog and explicit selection; searching or filtering must preserve selected MIX.
- Preserve the accepted mastered foil effect. Status visibility comes from labeled badges; do not replace card styling with thick status-colored border strips.
- Learn defaults to the Learning status filter; resetting its filters returns to Learning.
- Practice offers multiple choice, source-line flashcards, and full-chant recall before starting. Only selected MIX are tested; sessions finish without automatic additions. Partial line scores preserve existing full-chant status and schedule the next review.
- Multiple choice uses consecutive source rows, with 1, 3, 5, or all rows per MIX. Choices are unique real chant lines and exclude visible context. New MIX begin with a study card. Forgotten line cards remain visible until an explicit Next action.
- Full-chant recall uses Forgot/Remembered assessment; manual status controls remain in a disclosure. Results stay visible until an explicit action.
- Excerpts practice their complete parent MIX; source-pending entries are unavailable for practice. Browse and Progress study actions replace the Learn selection; opening a detail from Learn preserves its selection.
- Share-link language applies to the current session without changing the saved preference. Custom sharing explains that the recipient needs the custom MIX backup.
- Custom editing preserves authored chant text, reading overrides, initiators, notes, speed annotations, and optional-ending rows. Metadata-only edits preserve legacy chant fields. Bulk editing and backups retain the same custom authoring text.

# Task continuation

- Read `conductor/CURRENT_TASK.md` first; replace stale state in place. Source research is complete; consult `conductor/data-source-audit.md` only for a specific source discrepancy.
- Verify browser behavior in one isolated named agent-browser session. Prefix commands with `AGENT_BROWSER_ARGS="--use-mock-keychain,--password-store=basic,--mute-audio"`; inspect screenshots, scroll before clicking offscreen controls, and never navigate non-HTTP links.
- Run existing engine, seed, and roundtrip checks with `UV_THREADPOOL_SIZE=1`. `tests/smoke.mjs` targets an obsolete practice flow and does not verify current learning behavior.
- Preserve inherited dirty changes. Commit, push, deployment, PRs, and external writes require explicit current-turn authorization.
- Distinguish repository ownership from the authenticated GitHub user. When explicitly instructed to push the existing origin as hamzaabamboo, verify CLI and SSH authentication and push; do not substitute an ownership transfer or fork.
