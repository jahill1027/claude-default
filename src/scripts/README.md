# scripts

Content ingestion (Section 2 / M2). Scripts here pull open BFRD content from
bfrd.net and the Kobold Press Foundry data repo, normalize it into the app
schema (`src/schema`), and write JSON into `src/data`. Proprietary
Player's-Guide-only options are parsed/transcribed from the owner's uploaded
PDF into separate files tagged `source: 'proprietary'`.

Do not hand-transcribe open-content tables. Keep these scripts in the repo so
the data can be regenerated.
