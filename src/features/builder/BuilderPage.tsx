import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';

/** The 8-step ToV creation flow (Section 4). Rendered as a rail in M3. */
const STEPS = [
  'Concept',
  'Class',
  'Ability scores',
  'Lineage',
  'Heritage',
  'Background',
  'Equipment',
  'Review',
];

/**
 * The guided creation wizard. The full step flow with smart defaults arrives in
 * M3; M1 establishes the route and the progress rail layout.
 */
export function BuilderPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Create a character</h1>
        <p className="text-sm text-muted">Draft ID: {id}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <ol className="space-y-1">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-xs">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <Card>
          <p className="text-muted">
            The guided wizard is not built yet. The step-by-step flow with smart
            defaults and derived stats lands in Milestone&nbsp;M3.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to library
          </Link>
        </Card>
      </div>
    </div>
  );
}
