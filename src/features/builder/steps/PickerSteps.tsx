import {
  backgrounds,
  classes,
  heritages,
  lineages,
  skills,
} from '@/data';
import { useDraftStore } from '@/state/draftStore';

const skillLabel = (key: string) =>
  skills.find((s) => s.key === key)?.label ?? key;

export function ConceptStep() {
  const draft = useDraftStore((s) => s.draft);
  const patch = useDraftStore((s) => s.patch);

  return (
    <div className="max-w-lg space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-fg">Name</span>
        <input
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. Borin Stoneforge"
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-fg">
          Concept <span className="text-muted">(optional)</span>
        </span>
        <textarea
          value={draft.concept ?? ''}
          onChange={(e) => patch({ concept: e.target.value })}
          rows={3}
          placeholder="A short description of who this character is."
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </label>
    </div>
  );
}

export function ClassStep() {
  const draft = useDraftStore((s) => s.draft);
  const classSkills = useDraftStore((s) => s.classSkills);
  const selectClass = useDraftStore((s) => s.selectClass);
  const toggleClassSkill = useDraftStore((s) => s.toggleClassSkill);

  const def = classes.find((c) => c.id === draft.classId);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectClass(c.id)}
            aria-pressed={c.id === draft.classId}
            className={`rounded-lg border p-4 text-left transition-colors ${
              c.id === draft.classId
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-line bg-surface hover:border-primary/50 hover:bg-surface2'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg">{c.name}</span>
              <span className="text-xs text-muted">d{c.hitDie}</span>
            </div>
            <div className="mt-1 text-sm text-muted">{c.summary}</div>
            {c.spellcasting !== 'none' && (
              <div className="mt-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                {c.spellcasting} caster
              </div>
            )}
          </button>
        ))}
      </div>

      {def && (
        <div className="rounded-lg border border-line bg-surface2 p-4">
          <h3 className="font-semibold text-fg">{def.name} skills</h3>
          <p className="text-sm text-muted">
            Choose {def.skillChoices.choose} ({classSkills.length} selected). Save
            proficiencies: {def.savingThrowProficiencies.join(', ').toUpperCase()}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {def.skillChoices.from.map((key) => {
              const selected = classSkills.includes(key);
              const atCap =
                !selected && classSkills.length >= def.skillChoices.choose;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={atCap}
                  onClick={() => toggleClassSkill(key)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selected
                      ? 'border-primary bg-primary text-primaryFg'
                      : atCap
                        ? 'cursor-not-allowed border-line text-muted opacity-50'
                        : 'border-line text-fg hover:border-primary'
                  }`}
                >
                  {skillLabel(key)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function LineageStep() {
  const draft = useDraftStore((s) => s.draft);
  const selectLineage = useDraftStore((s) => s.selectLineage);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lineages.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => selectLineage(l.id)}
          aria-pressed={l.id === draft.lineageId}
          className={`rounded-lg border p-4 text-left transition-colors ${
            l.id === draft.lineageId
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-line bg-surface hover:border-primary/50 hover:bg-surface2'
          }`}
        >
          <div className="font-semibold text-fg">{l.name}</div>
          <div className="mt-1 text-xs text-muted">
            {l.size} · {l.speed} ft speed
          </div>
        </button>
      ))}
    </div>
  );
}

export function HeritageStep() {
  const draft = useDraftStore((s) => s.draft);
  const selectHeritage = useDraftStore((s) => s.selectHeritage);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {heritages.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => selectHeritage(h.id)}
          aria-pressed={h.id === draft.heritageId}
          className={`rounded-lg border p-4 text-left transition-colors ${
            h.id === draft.heritageId
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-line bg-surface hover:border-primary/50 hover:bg-surface2'
          }`}
        >
          <div className="font-semibold text-fg">{h.name}</div>
          {h.languages.length > 0 && (
            <div className="mt-1 text-xs text-muted">
              Languages: {h.languages.join(', ')}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function BackgroundStep() {
  const draft = useDraftStore((s) => s.draft);
  const selectBackground = useDraftStore((s) => s.selectBackground);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {backgrounds.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => selectBackground(b.id)}
          aria-pressed={b.id === draft.backgroundId}
          className={`rounded-lg border p-4 text-left transition-colors ${
            b.id === draft.backgroundId
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-line bg-surface hover:border-primary/50 hover:bg-surface2'
          }`}
        >
          <div className="font-semibold text-fg">{b.name}</div>
          {b.skillProficiencies.length > 0 && (
            <div className="mt-1 text-xs text-muted">
              Skills: {b.skillProficiencies.map(skillLabel).join(', ')}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
