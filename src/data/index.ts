import { z } from 'zod';
import { INCLUDE_PROPRIETARY } from '@/config';
import {
  backgroundDefSchema,
  classDefSchema,
  equipmentDefSchema,
  heritageDefSchema,
  lineageDefSchema,
  spellDefSchema,
  subclassDefSchema,
  talentDefSchema,
} from '@/schema';

import classesRaw from './classes.json';
import subclassesRaw from './subclasses.json';
import lineagesRaw from './lineages.json';
import heritagesRaw from './heritages.json';
import backgroundsRaw from './backgrounds.json';
import talentsRaw from './talents.json';
import spellsRaw from './spells.json';
import equipmentRaw from './equipment.json';

/**
 * Validates a raw JSON array against its schema and filters out proprietary
 * records when the build profile is `shareable`. Parsing here means bad data
 * fails loudly at startup rather than deep inside the UI.
 */
function load<T extends { source: 'open' | 'proprietary' }>(
  schema: z.ZodType<T>,
  raw: unknown,
  label: string,
): T[] {
  const parsed = z.array(schema).safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid content data in ${label}: ${parsed.error.message}`,
    );
  }
  return INCLUDE_PROPRIETARY
    ? parsed.data
    : parsed.data.filter((r) => r.source === 'open');
}

export const classes = load(classDefSchema, classesRaw, 'classes.json');
export const subclasses = load(
  subclassDefSchema,
  subclassesRaw,
  'subclasses.json',
);
export const lineages = load(lineageDefSchema, lineagesRaw, 'lineages.json');
export const heritages = load(heritageDefSchema, heritagesRaw, 'heritages.json');
export const backgrounds = load(
  backgroundDefSchema,
  backgroundsRaw,
  'backgrounds.json',
);
export const talents = load(talentDefSchema, talentsRaw, 'talents.json');
export const spells = load(spellDefSchema, spellsRaw, 'spells.json');
export const equipment = load(
  equipmentDefSchema,
  equipmentRaw,
  'equipment.json',
);

export const contentData = {
  classes,
  subclasses,
  lineages,
  heritages,
  backgrounds,
  talents,
  spells,
  equipment,
};
