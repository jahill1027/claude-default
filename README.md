# Tales of the Valiant — Character Builder

A personal, client-side character builder for **Tales of the Valiant (ToV)** in
the spirit of the D&D Beyond builder: guided creation, in-app leveling 1→20, and
a form-fillable PDF export. Everything runs locally — no backend, no accounts.

> **Personal build.** This bundles proprietary Player's-Guide content for
> private play and **must not be distributed**. See `ATTRIBUTION.md`. A
> shareable, open-only build is one flag away (`VITE_BUILD_PROFILE=shareable`).

Full design is in `ToVCharacterBuilderSPEC.md` (working draft).

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Zod · Vitest
(Dexie for persistence and pdf-lib for export arrive in later milestones.)

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite prints the local URL)
```

Other scripts:

```bash
npm run build      # type-check (tsc -b) and produce a production build
npm run preview    # serve the production build locally
npm run typecheck  # type-check only, no emit
npm test           # run the Vitest suite once
npm run test:watch # watch mode
```

## Project structure

```
src/
  data/        generated content JSON (classes, lineages, …) + profile-aware loader
  scripts/     content ingestion (M2)
  engine/      pure rules functions (M3+)
  schema/      Zod schemas + inferred TS types (character + content)
  state/       app state & persistence (Dexie, M4)
  pdf/         official sheet + field mapping + fill logic (M6)
  features/
    library/   saved characters (home route)
    builder/   step-by-step creation wizard
    sheet/     character sheet view + in-app leveling
  theme/       theme tokens, light/dark/system, persisted toggle
  components/  shared UI
```

## Milestone status

- **M1 — Skeleton + data contract** ✅ app shell, routing (`/`, `/build/:id`,
  `/sheet/:id`), theme tokens with light/dark/system toggle, Zod schemas for
  character + content, empty profile-aware `/data` loader, test harness.
- M2–M8: see the spec. Built and verified one milestone at a time.

## Content & licensing

Open rules content comes from the **Black Flag Reference Document** (CC-BY 4.0 /
ORC) by Kobold Press, derived in part from **SRD 5.1** by Wizards of the Coast.
Every content record is tagged `source: 'open' | 'proprietary'`. See
`ATTRIBUTION.md`.
