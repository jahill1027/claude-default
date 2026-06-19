# data

Shipped content JSON, validated against the Zod schemas in `src/schema` by the
loader in `index.ts`.

## File pairs: open vs proprietary

Each content type has two files:

- `<type>.open.json` — **generated** by `src/scripts/ingest.ts` from the open
  Black Flag Reference Document (CC-BY 4.0 / ORC). Do not hand-edit; re-run the
  ingester instead (`npm run ingest`).
- `<type>.proprietary.json` — Player's-Guide-only content (extra subclasses,
  lineages, heritages, options). Tagged `source: 'proprietary'` and kept in
  these separate files so a shareable build can exclude them. **Empty stubs for
  now**, pending transcription from the owner's Player's Guide PDF.

> ⚠️ Once a `*.proprietary.json` file contains Player's-Guide content, this build
> must not be published or distributed. A `VITE_BUILD_PROFILE=shareable` build
> excludes every proprietary record (see `src/config.ts`).

## Regenerating open content

```bash
npm run ingest
```

This clones the open-source Kobold Press Foundry system into `.cache/`
(git-ignored), normalizes it into the app schema, validates it, and rewrites the
`*.open.json` files. Provenance (source repo, commit, system version) is written
to `_meta.json`.
