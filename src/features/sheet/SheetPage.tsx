import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';

/**
 * The character sheet — the post-creation hub where in-app leveling (M5) and
 * PDF export (M6) happen. M1 establishes the route.
 */
export function SheetPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Character sheet</h1>
      <Card>
        <p className="text-muted">
          Character <span className="font-mono">{id}</span>. The sheet view,
          in-app leveling, and PDF export arrive in Milestones&nbsp;M5–M6.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Back to library
        </Link>
      </Card>
    </div>
  );
}
