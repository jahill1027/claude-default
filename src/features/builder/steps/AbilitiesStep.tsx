import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  type AbilityBlock,
  type AbilityKey,
} from '@/schema';
import {
  POINT_BUY_BUDGET,
  STANDARD_ARRAY,
  canApplyBump,
  pointBuyCost,
  pointBuyRemaining,
} from '@/engine';
import { useDraftStore, type AbilityMethod } from '@/state/draftStore';

const METHODS: { key: AbilityMethod; label: string }[] = [
  { key: 'standard', label: 'Standard array' },
  { key: 'pointBuy', label: 'Point buy' },
  { key: 'manual', label: 'Manual / rolled' },
];

function finalScore(
  abilities: AbilityBlock,
  bumps: { plus2: AbilityKey; plus1: AbilityKey },
  key: AbilityKey,
): number {
  let v = abilities[key];
  if (key === bumps.plus2) v += 2;
  if (key === bumps.plus1) v += 1;
  return Math.min(20, v);
}

export function AbilitiesStep() {
  const draft = useDraftStore((s) => s.draft);
  const method = useDraftStore((s) => s.abilityMethod);
  const setMethod = useDraftStore((s) => s.setAbilityMethod);
  const setAbilities = useDraftStore((s) => s.setAbilities);
  const setBumps = useDraftStore((s) => s.setBumps);

  const { abilities, abilityBumps: bumps } = draft;

  function chooseMethod(m: AbilityMethod) {
    setMethod(m);
    if (m === 'standard') {
      // Seed a default permutation of the array (STR-first).
      const seeded = Object.fromEntries(
        ABILITY_KEYS.map((k, i) => [k, STANDARD_ARRAY[i] ?? 10]),
      ) as AbilityBlock;
      setAbilities(seeded);
    } else if (m === 'pointBuy') {
      setAbilities({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    }
  }

  function setScore(key: AbilityKey, value: number) {
    setAbilities({ ...abilities, [key]: value });
  }

  const remaining = pointBuyRemaining(ABILITY_KEYS.map((k) => abilities[k]));

  // Standard array: disable a value once it's fully assigned (handles dup 14s).
  const arrayCounts = STANDARD_ARRAY.reduce<Record<number, number>>((a, v) => {
    a[v] = (a[v] ?? 0) + 1;
    return a;
  }, {});
  const uniqueValues = [...new Set(STANDARD_ARRAY)].sort((a, b) => b - a);
  const assignedElsewhere = (key: AbilityKey, value: number) =>
    ABILITY_KEYS.filter((k) => k !== key && abilities[k] === value).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => chooseMethod(m.key)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              method === m.key
                ? 'border-primary bg-primary text-primaryFg'
                : 'border-line text-fg hover:border-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
        {method === 'pointBuy' && (
          <span
            className={`ml-auto self-center text-sm font-medium ${
              remaining === 0
                ? 'text-fg'
                : remaining < 0
                  ? 'text-primary'
                  : 'text-muted'
            }`}
          >
            {remaining} / {POINT_BUY_BUDGET} points left
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Ability</th>
              <th className="px-3 py-2 text-left font-medium">Base</th>
              <th className="px-3 py-2 text-center font-medium">Bump</th>
              <th className="px-3 py-2 text-center font-medium">Final</th>
            </tr>
          </thead>
          <tbody>
            {ABILITY_KEYS.map((key) => {
              const bump =
                key === bumps.plus2 ? '+2' : key === bumps.plus1 ? '+1' : '';
              const final = finalScore(abilities, bumps, key);
              return (
                <tr key={key} className="border-t border-line">
                  <td className="px-3 py-2 font-medium text-fg">
                    {ABILITY_LABELS[key]}
                  </td>
                  <td className="px-3 py-2">
                    {method === 'standard' && (
                      <select
                        value={abilities[key]}
                        onChange={(e) => setScore(key, Number(e.target.value))}
                        className="rounded border border-line bg-surface px-2 py-1 text-fg"
                      >
                        {uniqueValues.map((v) => (
                          <option
                            key={v}
                            value={v}
                            disabled={
                              v !== abilities[key] &&
                              assignedElsewhere(key, v) >= arrayCounts[v]
                            }
                          >
                            {v}
                          </option>
                        ))}
                      </select>
                    )}
                    {method === 'pointBuy' && (
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Decrease ${key}`}
                          disabled={abilities[key] <= 8}
                          onClick={() => setScore(key, abilities[key] - 1)}
                          className="h-6 w-6 rounded border border-line text-fg disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-fg">
                          {abilities[key]}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${key}`}
                          disabled={
                            abilities[key] >= 18 ||
                            !Number.isFinite(pointBuyCost(abilities[key] + 1)) ||
                            remaining -
                              (pointBuyCost(abilities[key] + 1) -
                                pointBuyCost(abilities[key])) <
                              0
                          }
                          onClick={() => setScore(key, abilities[key] + 1)}
                          className="h-6 w-6 rounded border border-line text-fg disabled:opacity-40"
                        >
                          +
                        </button>
                      </span>
                    )}
                    {method === 'manual' && (
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={abilities[key]}
                        onChange={(e) =>
                          setScore(
                            key,
                            Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                          )
                        }
                        className="w-16 rounded border border-line bg-surface px-2 py-1 text-fg"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-muted">{bump}</td>
                  <td className="px-3 py-2 text-center font-semibold text-fg">
                    {final}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-line bg-surface2 p-4">
        <h3 className="font-semibold text-fg">Ability bumps</h3>
        <p className="text-sm text-muted">
          +2 to one score (16 or below) and +1 to a different score (17 or below).
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-fg">+2 to</span>
            <select
              value={bumps.plus2}
              onChange={(e) =>
                setBumps({ ...bumps, plus2: e.target.value as AbilityKey })
              }
              className="rounded border border-line bg-surface px-2 py-1 text-fg"
            >
              {ABILITY_KEYS.map((k) => (
                <option
                  key={k}
                  value={k}
                  disabled={k === bumps.plus1 || !canApplyBump(abilities[k], 2)}
                >
                  {ABILITY_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-fg">+1 to</span>
            <select
              value={bumps.plus1}
              onChange={(e) =>
                setBumps({ ...bumps, plus1: e.target.value as AbilityKey })
              }
              className="rounded border border-line bg-surface px-2 py-1 text-fg"
            >
              {ABILITY_KEYS.map((k) => (
                <option
                  key={k}
                  value={k}
                  disabled={k === bumps.plus2 || !canApplyBump(abilities[k], 1)}
                >
                  {ABILITY_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
