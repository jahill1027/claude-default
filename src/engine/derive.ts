import { classes, equipment, skills } from '@/data';
import type {
  AbilityBlock,
  AbilityKey,
  Character,
  ClassDef,
} from '@/schema';
import { ABILITY_KEYS } from '@/schema';
import { abilityModifier, applyBumps } from './abilities';

/**
 * The rules engine (Section 6.2–6.4): derive everything shown on the sheet from
 * a Character plus content data. Pure and fully testable. Derived values are
 * NEVER stored on the character.
 */

/** Proficiency bonus by total level (+2 at 1–4, +3 at 5–8, … +6 at 17–20). */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

export function getClassDef(classId: string): ClassDef | undefined {
  return classes.find((c) => c.id === classId);
}

/**
 * Final ability scores: base + creation bumps + recorded ASI increases, each
 * hard-capped at 20.
 */
export function finalAbilities(character: Character): AbilityBlock {
  const out = applyBumps(character.abilities, character.abilityBumps);
  for (const choice of character.asiOrTalentChoices) {
    if (choice.kind === 'asi') {
      for (const key of choice.increases) {
        out[key] = Math.min(20, out[key] + 1);
      }
    }
  }
  return out;
}

export function abilityModifiers(
  abilities: AbilityBlock,
): Record<AbilityKey, number> {
  return ABILITY_KEYS.reduce(
    (acc, key) => {
      acc[key] = abilityModifier(abilities[key]);
      return acc;
    },
    {} as Record<AbilityKey, number>,
  );
}

/** Armour class from equipped armour + Dex (Section 6.2). */
export function armorClass(
  character: Character,
  abilities: AbilityBlock,
): number {
  const dex = abilityModifier(abilities.dex);
  const equippedDefs = character.equipment
    .filter((item) => item.equipped)
    .map((item) => equipment.find((e) => e.id === item.defId))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  const body = equippedDefs.find(
    (d) => d.armor && d.armor.category !== 'shield',
  );
  const shield = equippedDefs.find((d) => d.armor?.category === 'shield');

  let ac: number;
  if (body?.armor) {
    const a = body.armor;
    const dexPart =
      a.dexBonus === 'full'
        ? dex
        : a.dexBonus === 'capped'
          ? Math.min(dex, a.dexCap ?? 2)
          : 0;
    ac = a.baseAc + dexPart;
  } else {
    ac = 10 + dex; // unarmored
  }
  if (shield?.armor) ac += shield.armor.baseAc;
  return ac;
}

/** Average hit-die value used by the "fixed" HP method, e.g. d10 -> 6. */
export function fixedHitDieValue(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

/**
 * Maximum HP (Section 6.4): level 1 is max hit die + CON mod; each later level
 * adds the rolled value (if tracked) or the fixed average, plus CON mod.
 */
export function maxHp(
  character: Character,
  abilities: AbilityBlock,
  classDef: ClassDef,
): number {
  const con = abilityModifier(abilities.con);
  const die = classDef.hitDie;
  const avg = fixedHitDieValue(die);

  let hp = die + con; // level 1
  for (let level = 2; level <= character.level; level++) {
    const gain =
      character.hp.method === 'rolled' && character.hp.rolls
        ? (character.hp.rolls[level - 2] ?? avg)
        : avg;
    hp += gain + con;
  }
  return Math.max(1, hp);
}

export interface AbilityDerived {
  mod: number;
  proficient: boolean;
  /** Modifier including proficiency bonus where applicable. */
  total: number;
}

export interface SkillDerived extends AbilityDerived {
  key: string;
  label: string;
  ability: AbilityKey;
}

export interface DerivedStats {
  finalAbilities: AbilityBlock;
  modifiers: Record<AbilityKey, number>;
  proficiencyBonus: number;
  maxHp: number;
  armorClass: number;
  initiative: number;
  passivePerception: number;
  saves: Record<AbilityKey, AbilityDerived>;
  skills: SkillDerived[];
}

/** Compute the full derived-stats bundle for the character sheet. */
export function deriveCharacter(character: Character): DerivedStats {
  const abilities = finalAbilities(character);
  const modifiers = abilityModifiers(abilities);
  const pb = proficiencyBonus(character.level);
  const classDef = getClassDef(character.classId);

  const saves = ABILITY_KEYS.reduce(
    (acc, key) => {
      const proficient = character.savingThrowProficiencies.includes(key);
      acc[key] = {
        mod: modifiers[key],
        proficient,
        total: modifiers[key] + (proficient ? pb : 0),
      };
      return acc;
    },
    {} as Record<AbilityKey, AbilityDerived>,
  );

  const skillStats: SkillDerived[] = skills.map((s) => {
    const proficient = character.skillProficiencies.includes(s.key);
    const mod = modifiers[s.ability];
    return {
      key: s.key,
      label: s.label,
      ability: s.ability,
      mod,
      proficient,
      total: mod + (proficient ? pb : 0),
    };
  });

  const perception = skillStats.find((s) => s.key === 'perception');

  return {
    finalAbilities: abilities,
    modifiers,
    proficiencyBonus: pb,
    maxHp: classDef ? maxHp(character, abilities, classDef) : 0,
    armorClass: armorClass(character, abilities),
    initiative: modifiers.dex,
    passivePerception: 10 + (perception?.total ?? modifiers.wis),
    saves,
    skills: skillStats,
  };
}
