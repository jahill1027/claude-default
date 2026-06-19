import { describe, expect, it } from 'vitest';
import {
  backgrounds,
  classes,
  features,
  heritages,
  lineages,
  selectByProfile,
  subclasses,
  talents,
} from './index';

/**
 * M2 acceptance: the generated open content loads, validates (the loader throws
 * otherwise), and is internally consistent. These also guard against future
 * ingestion regressions.
 */

describe('open content coverage', () => {
  it('has all 13 ToV classes', () => {
    expect(classes).toHaveLength(13);
    const ids = classes.map((c) => c.id).sort();
    expect(ids).toContain('mechanist'); // the ToV-specific class
    expect(ids).toContain('wizard');
  });

  it('gives every class a complete 20-level progression table', () => {
    for (const c of classes) {
      expect(c.progressionTable, c.id).toHaveLength(20);
      expect(c.progressionTable[0].proficiencyBonus).toBe(2);
      expect(c.progressionTable[19].proficiencyBonus).toBe(6);
      // Exactly one subclass-choice level.
      expect(c.progressionTable.filter((r) => r.subclassChoice)).toHaveLength(1);
      // ToV grants ASI-or-talent at least at 4/8/12/16/19.
      expect(c.progressionTable.filter((r) => r.asiOrTalent).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('has lineages, heritages, backgrounds, and talents', () => {
    expect(lineages.length).toBeGreaterThanOrEqual(6);
    expect(heritages.length).toBeGreaterThanOrEqual(9);
    expect(backgrounds.length).toBeGreaterThanOrEqual(3);
    expect(talents.length).toBeGreaterThanOrEqual(30);
    expect(lineages.find((l) => l.id === 'smallfolk')?.size).toBe('Small');
    expect(lineages.find((l) => l.id === 'human')?.size).toBe('Medium');
    expect(lineages.every((l) => l.speed > 0)).toBe(true);
  });

  it('tags every loaded record source: open in this (default) build', () => {
    const all = [
      ...classes,
      ...subclasses,
      ...features,
      ...lineages,
      ...heritages,
      ...backgrounds,
      ...talents,
    ];
    expect(all.every((r) => r.source === 'open')).toBe(true);
  });
});

describe('referential integrity', () => {
  const featureIds = new Set(features.map((f) => f.id));

  it('resolves every feature id referenced by class progression tables', () => {
    for (const c of classes) {
      for (const row of c.progressionTable) {
        for (const fid of row.features) {
          expect(featureIds.has(fid), `${c.id} L${row.level} -> ${fid}`).toBe(true);
        }
      }
    }
  });

  it('resolves every lineage and subclass feature reference', () => {
    for (const l of lineages) {
      for (const fid of l.traits) {
        expect(featureIds.has(fid), `${l.id} -> ${fid}`).toBe(true);
      }
    }
    for (const sc of subclasses) {
      for (const ids of Object.values(sc.featuresByLevel)) {
        for (const fid of ids) {
          expect(featureIds.has(fid), `${sc.id} -> ${fid}`).toBe(true);
        }
      }
    }
  });
});

describe('selectByProfile (BUILD_PROFILE filtering)', () => {
  const records = [
    { id: 'a', source: 'open' as const },
    { id: 'b', source: 'proprietary' as const },
  ];

  it('keeps proprietary records in a personal build', () => {
    expect(selectByProfile(records, true)).toHaveLength(2);
  });

  it('excludes proprietary records in a shareable build', () => {
    const result = selectByProfile(records, false);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });
});
