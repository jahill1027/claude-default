import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';

/**
 * The home route: a library of saved characters. Persistence (Dexie) and the
 * real character list land in M4 — for M1 this is the empty-state shell with a
 * working "New character" entry point into the builder.
 */
export function LibraryPage() {
  const navigate = useNavigate();

  function newCharacter() {
    const id = crypto.randomUUID();
    navigate(`/build/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Your characters</h1>
          <p className="text-sm text-muted">
            Create, level, and export Tales of the Valiant characters.
          </p>
        </div>
        <button
          type="button"
          onClick={newCharacter}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primaryFg transition-opacity hover:opacity-90"
        >
          + New character
        </button>
      </div>

      <Card className="text-center">
        <p className="text-muted">
          No characters yet. Saved characters will appear here once the library
          and persistence land (Milestone&nbsp;M4).
        </p>
      </Card>
    </div>
  );
}
