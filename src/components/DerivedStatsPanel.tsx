import { deriveCharacter } from '@/engine';
import { ABILITY_KEYS, ABILITY_LABELS, type Character } from '@/schema';

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-center">
      <div className="text-2xl font-bold text-fg">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

/**
 * Read-only derived statistics for a character (Section 6.2). Used by the
 * wizard's Review step and, later, the character sheet.
 */
export function DerivedStatsPanel({ character }: { character: Character }) {
  const d = deriveCharacter(character);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <Stat label="Armor Class" value={d.armorClass} />
        <Stat label="Hit Points" value={d.maxHp} />
        <Stat label="Prof. Bonus" value={fmt(d.proficiencyBonus)} />
        <Stat label="Initiative" value={fmt(d.initiative)} />
        <Stat label="Passive Per." value={d.passivePerception} />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Abilities &amp; saves
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {ABILITY_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-lg border border-line bg-surface p-2 text-center"
            >
              <div className="text-xs uppercase text-muted">{key}</div>
              <div className="text-xl font-bold text-fg">
                {d.finalAbilities[key]}
              </div>
              <div className="text-sm text-muted">{fmt(d.modifiers[key])}</div>
              <div className="mt-1 border-t border-line pt-1 text-xs text-muted">
                save{' '}
                <span
                  className={
                    d.saves[key].proficient ? 'font-semibold text-fg' : ''
                  }
                >
                  {fmt(d.saves[key].total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Skills
        </h4>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {d.skills.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between border-b border-line/50 py-0.5 text-sm"
            >
              <span className={s.proficient ? 'font-semibold text-fg' : 'text-muted'}>
                {s.proficient ? '● ' : '○ '}
                {s.label}
                <span className="ml-1 text-xs uppercase text-muted">
                  ({ABILITY_LABELS[s.ability].slice(0, 3)})
                </span>
              </span>
              <span className="tabular-nums text-fg">{fmt(s.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
