# state

Application state and persistence. The character object is the single source of
truth; derived stats are computed by `src/engine`, never stored.

- Theme state lives in `src/theme/themeStore.ts` (Zustand, persisted).
- The character store and IndexedDB persistence via Dexie land in M4.
