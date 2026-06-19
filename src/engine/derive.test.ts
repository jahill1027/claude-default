import { describe, expect, it } from 'vitest';
import type { Character } from '@/schema';
import {
  deriveCharacter,
  finalAbilities,
  maxHp,
  proficiencyBonus,
  getClassDef,
} from './derive';

/**
 * A fully worked level-1 Fighter — the M3 acceptance case. Numbers are checked
 * by hand against the BFRD progression and AC/HP rules.
 *
 * Base 15/14/13/10/12/8, bumps +2 STR / +1 CON -> finals STR17 DEX14 CON14
 * INT10 WIS12 CHA8. Fighter: d10 hit die, save profs STR & CON.
 * Equipped: studded leather (light, base 12 + full Dex) + shield (+2).
 */
function fighter(): Character {
  return {
    id: 'c1',
    name: 'Borin',
    level: 1,
    classId: 'fighter',
    lineageId: 'dwarf',
    heritageId: 'cottage',
    backgroundId: 'soldier',
    abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
    abilityBumps: { plus2: 'str', plus1: 'con' },
    asiOrTalentChoices: [],
    skillProficiencies: ['athletics', 'intimidation'],
    savingThrowProficiencies: ['str', 'con'],
    languages: ['common'],
    talents: [],
    equipment: [
      { defId: 'studded-leather', quantity: 1, equipped: true },
      { defId: 'shield', quantity: 1, equipped: true },
    ],
    hp: { method: 'fixed' },
    meta: {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      rulesetVersion: 'bfrd-2025-07-01',
    },
  };
}

describe('proficiencyBonus', () => {
  it('scales by total level', () => {
    expect([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(proficiencyBonus)).toEqual([
      2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    ]);
  });
});

describe('finalAbilities', () => {
  it('applies creation bumps to the base scores', () => {
    const f = finalAbilities(fighter());
    expect(f).toEqual({ str: 17, dex: 14, con: 14, int: 10, wis: 12, cha: 8 });
  });

  it('adds recorded ASI increases on top', () => {
    const c = fighter();
    c.asiOrTalentChoices = [{ kind: 'asi', level: 4, increases: ['str', 'dex'] }];
    const f = finalAbilities(c);
    expect(f.str).toBe(18);
    expect(f.dex).toBe(15);
  });
});

describe('deriveCharacter (level-1 fighter)', () => {
  const d = deriveCharacter(fighter());

  it('uses the ingested fighter class data', () => {
    expect(getClassDef('fighter')?.hitDie).toBe(10);
  });

  it('proficiency bonus is +2', () => {
    expect(d.proficiencyBonus).toBe(2);
  });

  it('HP = max hit die + CON mod (10 + 2 = 12)', () => {
    expect(d.maxHp).toBe(12);
  });

  it('AC = studded leather (12 + Dex 2) + shield 2 = 16', () => {
    expect(d.armorClass).toBe(16);
  });

  it('initiative equals the Dex modifier (+2)', () => {
    expect(d.initiative).toBe(2);
  });

  it('saving throws apply proficiency to STR and CON only', () => {
    expect(d.saves.str.total).toBe(5); // +3 mod + 2 PB
    expect(d.saves.con.total).toBe(4); // +2 mod + 2 PB
    expect(d.saves.dex.total).toBe(2); // +2 mod, not proficient
    expect(d.saves.str.proficient).toBe(true);
    expect(d.saves.dex.proficient).toBe(false);
  });

  it('skill modifiers apply proficiency where trained', () => {
    const athletics = d.skills.find((s) => s.key === 'athletics')!;
    const stealth = d.skills.find((s) => s.key === 'stealth')!;
    expect(athletics.total).toBe(5); // STR +3 + PB 2
    expect(athletics.proficient).toBe(true);
    expect(stealth.total).toBe(2); // DEX +2, untrained
  });

  it('passive perception = 10 + Perception modifier', () => {
    expect(d.passivePerception).toBe(11); // 10 + WIS +1 (untrained)
  });
});

describe('maxHp across levels (fixed method)', () => {
  it('adds the fixed average + CON each level', () => {
    const c = fighter();
    c.level = 3;
    // L1: 10+2; L2: 6+2; L3: 6+2  => 12 + 8 + 8 = 28
    expect(maxHp(c, finalAbilities(c), getClassDef('fighter')!)).toBe(28);
  });
});

describe('unarmored AC', () => {
  it('is 10 + Dex with nothing equipped', () => {
    const c = fighter();
    c.equipment = [];
    expect(deriveCharacter(c).armorClass).toBe(12); // 10 + Dex 2
  });
});
