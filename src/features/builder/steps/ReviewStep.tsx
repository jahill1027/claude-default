import { DerivedStatsPanel } from '@/components/DerivedStatsPanel';
import { backgrounds, classes, heritages, lineages } from '@/data';
import { useDraftStore } from '@/state/draftStore';

function name<T extends { id: string; name: string }>(
  list: T[],
  id: string,
): string {
  return list.find((x) => x.id === id)?.name ?? '—';
}

export function ReviewStep() {
  const draft = useDraftStore((s) => s.draft);

  const missing: string[] = [];
  if (!draft.name.trim()) missing.push('a name');
  if (!draft.classId) missing.push('a class');
  if (!draft.lineageId) missing.push('a lineage');
  if (!draft.heritageId) missing.push('a heritage');
  if (!draft.backgroundId) missing.push('a background');

  const ready = missing.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-surface2 p-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <span className="font-display text-xl font-semibold text-fg">
            {draft.name || 'Unnamed'}
          </span>
          <span className="text-sm text-muted">
            Level {draft.level} {name(classes, draft.classId)} ·{' '}
            {name(lineages, draft.lineageId)} ·{' '}
            {name(heritages, draft.heritageId)} ·{' '}
            {name(backgrounds, draft.backgroundId)}
          </span>
        </div>
      </div>

      {!ready && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-fg">
          Still need: {missing.join(', ')}. The stats below use defaults until
          then.
        </div>
      )}

      <DerivedStatsPanel character={draft} />

      <p className="text-sm text-muted">
        Saving to your local library lands in Milestone&nbsp;M4. For now this
        screen confirms the derived stats compute correctly.
      </p>
    </div>
  );
}
