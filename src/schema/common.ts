import { z } from 'zod';

/** The six ability scores, keyed by their short code. */
export const abilityKeySchema = z.enum([
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
]);
export type AbilityKey = z.infer<typeof abilityKeySchema>;

export const ABILITY_KEYS = abilityKeySchema.options;

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

/**
 * Licensing provenance for every content record.
 *  - `open`        : Black Flag Reference Document (CC-BY 4.0 / ORC). Shareable.
 *  - `proprietary` : Player's-Guide-only content. Personal build only.
 */
export const sourceSchema = z.enum(['open', 'proprietary']);
export type Source = z.infer<typeof sourceSchema>;

/** ToV organizes spell levels into "circles" (0 = cantrip … 9). */
export const circleSchema = z.number().int().min(0).max(9);

/** The four ToV spell traditions. */
export const traditionSchema = z.enum([
  'Arcane',
  'Divine',
  'Primordial',
  'Wyrd',
]);
export type Tradition = z.infer<typeof traditionSchema>;
