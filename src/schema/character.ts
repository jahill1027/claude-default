import { z } from 'zod';
import { abilityKeySchema } from './common';

/**
 * The saved Character object (Section 5).
 *
 * This is the single source of truth. Derived values (modifiers, AC, HP totals,
 * proficiency bonus, save/skill modifiers, spell slots) are NEVER stored here —
 * the engine computes them from this object plus content data. Every per-level
 * choice IS recorded so the build is reproducible and reversible.
 */

const abilityScoreSchema = z.number().int().min(1).max(30);

export const abilityBlockSchema = z.object({
  str: abilityScoreSchema,
  dex: abilityScoreSchema,
  con: abilityScoreSchema,
  int: abilityScoreSchema,
  wis: abilityScoreSchema,
  cha: abilityScoreSchema,
});
export type AbilityBlock = z.infer<typeof abilityBlockSchema>;

/** The lineage-independent +2 / +1 bump applied at character creation. */
export const abilityBumpsSchema = z.object({
  plus2: abilityKeySchema,
  plus1: abilityKeySchema,
});
export type AbilityBumps = z.infer<typeof abilityBumpsSchema>;

/** Choice recorded at an ASI-or-talent level: take ability increases… */
export const asiChoiceSchema = z.object({
  kind: z.literal('asi'),
  level: z.number().int().min(1).max(20),
  /** One or two ability keys receiving +1 (or a single key receiving +2). */
  increases: z.array(abilityKeySchema).min(1).max(2),
});

/** …or take a talent instead. */
export const talentChoiceSchema = z.object({
  kind: z.literal('talent'),
  level: z.number().int().min(1).max(20),
  talentId: z.string().min(1),
});

export const levelChoiceSchema = z.discriminatedUnion('kind', [
  asiChoiceSchema,
  talentChoiceSchema,
]);
export type LevelChoice = z.infer<typeof levelChoiceSchema>;

export const hpSchema = z.object({
  method: z.enum(['fixed', 'rolled']),
  /** Per-level rolls (levels 2+) when method is 'rolled'. */
  rolls: z.array(z.number().int().min(1)).optional(),
  /** Current HP if the user is tracking damage; max is derived. */
  current: z.number().int().optional(),
});

export const spellcastingSelectionSchema = z.object({
  knownOrPrepared: z.array(z.string()).default([]),
  cantrips: z.array(z.string()).default([]),
  // Slots are derived from class + level, never stored.
});

export const equipmentItemSchema = z.object({
  defId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  equipped: z.boolean().default(false),
});
export type EquipmentItem = z.infer<typeof equipmentItemSchema>;

export const characterMetaSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  rulesetVersion: z.string(),
});

export const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  portraitDataUrl: z.string().optional(),
  concept: z.string().optional(),

  level: z.number().int().min(1).max(20),

  classId: z.string().min(1),
  subclassId: z.string().optional(),
  lineageId: z.string().min(1),
  heritageId: z.string().min(1),
  backgroundId: z.string().min(1),

  abilities: abilityBlockSchema, // base, pre-derivation
  abilityBumps: abilityBumpsSchema,
  asiOrTalentChoices: z.array(levelChoiceSchema).default([]),

  skillProficiencies: z.array(z.string()).default([]),
  savingThrowProficiencies: z.array(abilityKeySchema).default([]),
  languages: z.array(z.string()).default([]),
  talents: z.array(z.string()).default([]),
  equipment: z.array(equipmentItemSchema).default([]),

  hp: hpSchema,
  spellcasting: spellcastingSelectionSchema.optional(),

  notes: z.string().optional(),
  meta: characterMetaSchema,
});
export type Character = z.infer<typeof characterSchema>;
