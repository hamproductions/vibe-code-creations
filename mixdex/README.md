# MIXDEX

Offline-first PWA: a Pokédex-style codex of idol-live MIX / koujou chants plus a spaced-repetition trainer.

- **Codex** – 124 seeded mixes in 3 priority tiers (Essential / Common / Deep Cuts), locked silhouettes → foil cards when mastered.
- **Practice** – Tap Bank and Rhythm (metronome) modes, baisoku 2×/4× speed, interference decoys built from linguistically similar words.
- **SRS** – SM-2 style (`status`, `interval`, `easeFactor`, `streak`), grades 0–5 from accuracy + speed/timing.
- **Storage** – IndexedDB via Dexie (vendored), in-memory fallback. No build step: serve the folder statically.
- **UI** – EN / 日本語, chant script kana / romaji / both, WanaKana (vendored) for romaji search + custom-mix input.

Tests: `node tests/engine.test.mjs`, `node tests/check-seed.mjs`, `node tests/smoke.mjs` (needs Playwright + Chromium).
Seed data lives in `src/seed.js` (core 8) and `src/seedText.js` (chant DSL, see `src/parse.js`). Bump `SEED_VERSION` after editing.
