import { describe, expect, it } from 'vitest';
import { characterSchema, type Character } from './character';
import { classDefSchema, progressionRowSchema } from './content';

/**
 * Contract tests: prove the schemas parse a representative object and reject a
 * malformed one. These are the M1 "schemas compile and validate" guardrail.
 */

const sampleCharacter: Character = {
  id: 'char-1',
  name: 'Test Fighter',
  level: 1,
  classId: 'fighter',
  lineageId: 'human',
  heritageId: 'cosmopolitan',
  backgroundId: 'soldier',
  abilities: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  abilityBumps: { plus2: 'str', plus1: 'con' },
  asiOrTalentChoices: [],
  skillProficiencies: ['Athletics', 'Intimidation'],
  savingThrowProficiencies: ['str', 'con'],
  languages: ['Common'],
  talents: [],
  equipment: [],
  hp: { method: 'fixed' },
  meta: {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    rulesetVersion: 'bfrd-2025-07-01',
  },
};

describe('characterSchema', () => {
  it('accepts a valid level-1 character', () => {
    expect(() => characterSchema.parse(sampleCharacter)).not.toThrow();
  });

  it('rejects an out-of-range level', () => {
    const bad = { ...sampleCharacter, level: 21 };
    expect(characterSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an unknown ability key in bumps', () => {
    const bad = { ...sampleCharacter, abilityBumps: { plus2: 'luck', plus1: 'con' } };
    expect(characterSchema.safeParse(bad).success).toBe(false);
  });
});

describe('content schemas', () => {
  it('applies defaults on a progression row', () => {
    const row = progressionRowSchema.parse({ level: 1, proficiencyBonus: 2 });
    expect(row.features).toEqual([]);
    expect(row.subclassChoice).toBe(false);
    expect(row.asiOrTalent).toBe(false);
  });

  it('rejects an invalid hit die', () => {
    const result = classDefSchema.safeParse({
      id: 'x',
      name: 'X',
      source: 'open',
      hitDie: 7,
      primaryAbilities: ['str'],
      savingThrowProficiencies: ['str'],
      skillChoices: { choose: 2, from: ['Athletics'] },
      progressionTable: [],
      spellcasting: 'none',
    });
    expect(result.success).toBe(false);
  });
});
