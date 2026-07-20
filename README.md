# Bane Lite

A local-first **Progressive Web App** workout tracker — a web port of the native iOS
app *Bane*. Log workouts, build routines, track personal records and body metrics,
entirely offline. All data lives in your browser (IndexedDB); nothing is sent to a
server.

## Stack

- **SvelteKit 2 + Svelte 5** (runes), TypeScript, Vite
- **Dexie.js** — IndexedDB data layer (workouts, routines, exercises, measurements)
- **Workbox** via `@vite-pwa/sveltekit` — offline service worker + installable manifest
- **adapter-static** — single-page app, no backend

## Features

- **Workouts** — start empty or from a routine; log sets (reps × weight), mark
  warm-ups, complete sets to trigger the between-sets **rest timer** (with local
  notification + vibration).
- **Routines** — reusable templates with per-set targets and optional
  **double-progression** (progressive overload) that auto-computes next targets from
  your last session.
- **Programs** — ready-made plans (StrongLifts 5×5, Push/Pull/Legs, Full-Body
  Beginner) that instantiate into routines.
- **Exercises** — a seeded library of ~75 exercises plus your own custom ones.
- **Records** — heaviest weight, estimated 1RM (Epley), and best set volume per
  exercise, derived live from history.
- **Charts** — volume-per-workout and estimated-1RM trends (inline SVG).
- **Muscle heat map**, **calendar** with training-day streaks, **achievements**.
- **Calculators** — plate loader and warm-up ramp.
- **Body measurements** — bodyweight, body-fat %, and circumferences over time.
- **Settings** — lb/kg units (all data stored canonically in pounds), rest defaults,
  plate/warm-up preferences, and **JSON export/import** for backup & data portability
  (the local-first replacement for the native app's iCloud sync).

## Native features intentionally dropped

The native app used Apple HealthKit, iCloud/CloudKit sync, and Siri/App Intents, which
have no web equivalent. Their web stand-ins: local-first storage + JSON/CSV export &
import, and PWA manifest shortcuts.

## Develop

Requires Node 20+.

```sh
pnpm install
pnpm dev            # dev server
pnpm build          # production build → ./build
pnpm preview        # serve the production build
pnpm check          # svelte-check (type + a11y)
```
