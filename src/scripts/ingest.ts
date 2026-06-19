/**
 * Content ingestion (Milestone M2).
 *
 * Pulls open Black Flag Reference Document content from the Kobold Press
 * open-source Foundry system, normalizes it into the app schema, validates it,
 * and writes the `*.open.json` files in src/data. Every record is tagged
 * source: 'open'. Proprietary Player's-Guide content is NOT handled here — it
 * lives in the hand-curated `*.proprietary.json` files.
 *
 * Run with: npm run ingest
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  ABILITY_MAP,
  REPO_ROOT,
  advLevel,
  advRestriction,
  advancements,
  buildIdIndex,
  cleanText,
  ensureSource,
  loadDir,
  proficiencyBonus,
  slug,
  uuidToId,
  type FoundryDoc,
} from './foundry';
import {
  abilityRulesSchema,
  backgroundDefSchema,
  classDefSchema,
  equipmentDefSchema,
  featureDefSchema,
  heritageDefSchema,
  lineageDefSchema,
  progressionRowSchema,
  skillDefSchema,
  spellcastingTypeSchema,
  subclassDefSchema,
  talentDefSchema,
  type AbilityKey,
  type AbilityRules,
  type BackgroundDef,
  type ClassDef,
  type EquipmentDef,
  type FeatureDef,
  type HeritageDef,
  type LineageDef,
  type ProgressionRow,
  type SkillDef,
  type SubclassDef,
  type TalentDef,
} from '../schema';
import { z } from 'zod';

const DATA_DIR = path.join(REPO_ROOT, 'src', 'data');

const warnings: string[] = [];
function warn(msg: string) {
  warnings.push(msg);
}

/** Collected feature definitions, de-duplicated by id. */
const featureMap = new Map<string, FeatureDef>();

function addFeature(
  uuid: string,
  index: Map<string, FoundryDoc>,
  parentId: string,
  kind: FeatureDef['kind'],
  level?: number,
): string | null {
  const doc = index.get(uuidToId(uuid));
  if (!doc) {
    warn(`Unresolved feature UUID ${uuid} (parent ${parentId})`);
    return null;
  }
  const id = `${parentId}-${slug(doc.name)}`;
  if (!featureMap.has(id)) {
    featureMap.set(id, {
      id,
      name: doc.name,
      source: 'open',
      kind,
      parentId,
      level,
      description: cleanText(doc.system?.description?.value),
    });
  }
  return id;
}

/** Feature ids granted by a list of grantFeatures advancements, grouped by level. */
function grantsByLevel(
  doc: FoundryDoc,
  index: Map<string, FoundryDoc>,
  parentId: string,
  kind: FeatureDef['kind'],
): Map<number, string[]> {
  const byLevel = new Map<number, string[]>();
  for (const a of advancements(doc)) {
    if (a.type !== 'grantFeatures') continue;
    if (advRestriction(a) === 'multiclass') continue;
    const level = advLevel(a) ?? 0;
    const pool: Array<{ uuid?: string }> = a.configuration?.pool ?? [];
    for (const p of pool) {
      if (!p.uuid) continue;
      const fid = addFeature(p.uuid, index, parentId, kind, level);
      if (fid) {
        const list = byLevel.get(level) ?? [];
        list.push(fid);
        byLevel.set(level, list);
      }
    }
  }
  return byLevel;
}

/** Trait advancements that grant fixed proficiencies of a given prefix. */
function traitGrants(doc: FoundryDoc, prefix: string): string[] {
  const out: string[] = [];
  for (const a of advancements(doc)) {
    if (a.type !== 'trait' || advRestriction(a) === 'multiclass') continue;
    for (const g of a.configuration?.grants ?? []) {
      if (typeof g === 'string' && g.startsWith(prefix)) out.push(g);
    }
  }
  return out;
}

/** First trait choice whose pool matches a prefix, as { choose, from }. */
function traitChoice(
  doc: FoundryDoc,
  prefix: string,
): { choose: number; from: string[] } | undefined {
  for (const a of advancements(doc)) {
    if (a.type !== 'trait' || advRestriction(a) === 'multiclass') continue;
    for (const c of a.configuration?.choices ?? []) {
      const pool: string[] = c.pool ?? [];
      if (pool.some((p) => p.startsWith(prefix))) {
        return {
          choose: c.count ?? 1,
          from: pool
            .filter((p) => p.startsWith(prefix))
            .map((p) => p.slice(prefix.length)),
        };
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

function extractClasses(
  allDocs: FoundryDoc[],
  index: Map<string, FoundryDoc>,
): { classes: ClassDef[]; subclasses: SubclassDef[] } {
  const classItems = allDocs.filter((d) => d.type === 'class');
  const subclassItems = allDocs.filter((d) => d.type === 'subclass');

  // Subclass selection level per class = lowest level any of its subclasses
  // grants a feature.
  const subclassLevelByClass = new Map<string, number>();
  for (const sc of subclassItems) {
    const classId = sc.system?.identifier?.class;
    if (!classId) continue;
    const levels = advancements(sc)
      .filter((a) => a.type === 'grantFeatures')
      .map((a) => advLevel(a))
      .filter((l): l is number => typeof l === 'number');
    const min = levels.length ? Math.min(...levels) : 3;
    subclassLevelByClass.set(
      classId,
      Math.min(subclassLevelByClass.get(classId) ?? Infinity, min),
    );
  }

  const subclasses: SubclassDef[] = subclassItems.map((sc) => {
    const classId: string = sc.system?.identifier?.class ?? 'unknown';
    const id = slug(sc.name);
    const byLevel = grantsByLevel(sc, index, id, 'subclass');
    const featuresByLevel: Record<string, string[]> = {};
    for (const [lvl, ids] of byLevel) featuresByLevel[String(lvl)] = ids;
    return {
      id,
      name: sc.name,
      source: 'open',
      classId,
      featuresByLevel,
      summary: cleanText(sc.system?.description?.short) || undefined,
    };
  });

  const classes: ClassDef[] = classItems.map((cls) => {
    const id: string = cls.system?.identifier?.value ?? slug(cls.name);
    const advs = advancements(cls);

    const hitDie =
      Number(advs.find((a) => a.type === 'hitPoints')?.configuration?.denomination) ||
      8;

    const keyAbility = advs.find((a) => a.type === 'keyAbility');
    const primaryAbilities = (keyAbility?.configuration?.options ?? [])
      .map((o: string) => ABILITY_MAP[o])
      .filter(Boolean) as AbilityKey[];

    const savingThrowProficiencies = traitGrants(cls, 'saves:')
      .map((s) => ABILITY_MAP[s.slice('saves:'.length)])
      .filter(Boolean) as AbilityKey[];

    const skill = traitChoice(cls, 'skills:');
    const skillChoices = skill ?? { choose: 0, from: [] };

    const spellAdv = advs.find((a) => a.type === 'spellcasting');
    const rawProgression = spellAdv?.configuration?.progression ?? 'none';
    const spellcasting = spellcastingTypeSchema.safeParse(rawProgression).success
      ? (rawProgression as ClassDef['spellcasting'])
      : 'none';
    const spellcastingAbility = spellAdv
      ? (ABILITY_MAP[spellAdv.configuration?.ability] as AbilityKey | undefined)
      : undefined;

    const improvementLevels = new Set(
      advs
        .filter((a) => a.type === 'improvement')
        .map((a) => advLevel(a))
        .filter((l): l is number => typeof l === 'number'),
    );

    const featuresByLevel = grantsByLevel(cls, index, id, 'class');
    const subclassLevel = subclassLevelByClass.get(id) ?? 3;

    const progressionTable: ProgressionRow[] = Array.from(
      { length: 20 },
      (_, i) => {
        const level = i + 1;
        return progressionRowSchema.parse({
          level,
          proficiencyBonus: proficiencyBonus(level),
          features: featuresByLevel.get(level) ?? [],
          subclassChoice: level === subclassLevel,
          asiOrTalent: improvementLevels.has(level),
        });
      },
    );

    return {
      id,
      name: cls.name,
      source: 'open',
      hitDie,
      primaryAbilities,
      savingThrowProficiencies,
      skillChoices,
      progressionTable,
      equipmentKit: [],
      spellcasting,
      spellcastingAbility:
        spellcasting === 'none' ? undefined : spellcastingAbility,
      summary: cleanText(cls.system?.description?.short) || undefined,
    } satisfies ClassDef;
  });

  return { classes, subclasses };
}

function extractLineages(
  sourceRoot: string,
  index: Map<string, FoundryDoc>,
): LineageDef[] {
  const docs = loadDir(path.join(sourceRoot, 'lineages')).filter(
    (d) => d.type === 'lineage',
  );
  return docs.map((d) => {
    const id: string = d.system?.identifier?.value ?? slug(d.name);
    // options may list several allowed sizes (a lineage size choice). Default to
    // Medium whenever it is permitted; only truly Small-only lineages are Small.
    const sizeOptions: string[] = advancements(d).find((a) => a.type === 'size')
      ?.configuration?.options ?? ['medium'];
    const size = sizeOptions.includes('medium') ? 'Medium' : 'Small';

    const rawDesc: string = d.system?.description?.value ?? '';
    const speedMatch = rawDesc.match(/base walking speed is (\d+)\s*feet/i);
    const speed = speedMatch ? Number(speedMatch[1]) : 30;
    if (!speedMatch) warn(`No speed found for lineage ${id}; defaulting to 30`);

    const byLevel = grantsByLevel(d, index, id, 'lineage');
    const traits = [...byLevel.values()].flat();

    return {
      id,
      name: d.name,
      source: 'open',
      size,
      speed,
      traits,
      description: cleanText(rawDesc) || undefined,
    } satisfies LineageDef;
  });
}

function extractHeritages(
  sourceRoot: string,
  index: Map<string, FoundryDoc>,
): HeritageDef[] {
  const docs = loadDir(path.join(sourceRoot, 'heritages')).filter(
    (d) => d.type === 'heritage',
  );
  return docs.map((d) => {
    const id: string = d.system?.identifier?.value ?? slug(d.name);
    const byLevel = grantsByLevel(d, index, id, 'heritage');
    const featureIds = [...byLevel.values()].flat();
    const traitText = featureIds
      .map((fid) => featureMap.get(fid)?.description)
      .filter(Boolean)
      .join('\n\n');

    return {
      id,
      name: d.name,
      source: 'open',
      skillProficiencies: traitGrants(d, 'skills:').map((s) =>
        s.slice('skills:'.length),
      ),
      languages: traitGrants(d, 'languages:').map((s) =>
        s.replace(/^languages:(standard:|exotic:)?/, ''),
      ),
      trait: traitText || undefined,
      description: cleanText(d.system?.description?.value) || undefined,
    } satisfies HeritageDef;
  });
}

function extractBackgrounds(sourceRoot: string): BackgroundDef[] {
  const docs = loadDir(path.join(sourceRoot, 'backgrounds')).filter(
    (d) => d.type === 'background',
  );
  return docs.map((d) => {
    const id: string = d.system?.identifier?.value ?? slug(d.name);
    return {
      id,
      name: d.name,
      source: 'open',
      skillProficiencies: traitGrants(d, 'skills:').map((s) =>
        s.slice('skills:'.length),
      ),
      skillChoices: traitChoice(d, 'skills:'),
      languages: traitGrants(d, 'languages:').map((s) =>
        s.replace(/^languages:(standard:|exotic:)?/, ''),
      ),
      equipment: [],
      description: cleanText(d.system?.description?.value) || undefined,
    } satisfies BackgroundDef;
  });
}

function extractTalents(sourceRoot: string): TalentDef[] {
  const docs = loadDir(path.join(sourceRoot, 'talents')).filter(
    (d) => d.system?.type?.category,
  );
  const catMap: Record<string, TalentDef['category']> = {
    magic: 'Magic',
    martial: 'Martial',
    technical: 'Technical',
  };
  return docs.map((d) => {
    const category = catMap[d.system.type.category] ?? 'Technical';
    const prerequisites: string[] = [];
    for (const f of d.system?.restriction?.filters ?? []) {
      const abil = String(f.k ?? '').match(/abilities\.(\w+)\.value/);
      if (abil && f.v != null) {
        const name = abil[1][0].toUpperCase() + abil[1].slice(1);
        prerequisites.push(`${name} ${f.v}`);
      }
    }
    return {
      id: slug(d.name),
      name: d.name,
      source: 'open',
      category,
      prerequisites,
      effect: cleanText(d.system?.description?.value),
    } satisfies TalentDef;
  });
}

function priceString(price: any): string | undefined {
  if (!price || price.value == null) return undefined;
  return `${price.value} ${price.denomination ?? 'gp'}`;
}

function weightNumber(weight: any): number | undefined {
  if (typeof weight === 'number') return weight;
  if (weight && typeof weight.value === 'number') return weight.value;
  return undefined;
}

function extractEquipment(sourceRoot: string): EquipmentDef[] {
  const out: EquipmentDef[] = [];

  for (const d of loadDir(path.join(sourceRoot, 'items', 'armor'))) {
    if (d.type !== 'armor') continue;
    const s = d.system;
    const cat: string = s.type?.category ?? 'light';
    const props: string[] = s.properties ?? [];
    const dexBonus =
      cat === 'light' ? 'full' : cat === 'medium' ? 'capped' : 'none';
    out.push({
      id: slug(d.name),
      name: d.name,
      source: 'open',
      category: 'armor',
      cost: priceString(s.price),
      weight: weightNumber(s.weight),
      armor: {
        category: cat as 'light' | 'medium' | 'heavy' | 'shield',
        // Shields contribute a flat +2 (stored as null base in source).
        baseAc: cat === 'shield' ? 2 : Number(s.armor?.value ?? 10),
        dexBonus,
        dexCap: cat === 'medium' ? 2 : undefined,
        stealthDisadvantage: props.includes('noisy'),
      },
    });
  }

  for (const d of loadDir(path.join(sourceRoot, 'items', 'weapons'))) {
    if (d.type !== 'weapon') continue;
    const s = d.system;
    const dmg = s.damage ?? {};
    const damage = dmg.denomination
      ? `${dmg.number ?? 1}d${dmg.denomination}`
      : '';
    out.push({
      id: slug(d.name),
      name: d.name,
      source: 'open',
      category: 'weapon',
      cost: priceString(s.price),
      weight: weightNumber(s.weight),
      weapon: {
        damage,
        damageType: dmg.type ?? '',
        properties: [
          s.type?.category,
          s.type?.value,
          ...(s.properties ?? []),
        ].filter(Boolean),
      },
    });
  }

  return out;
}

/** Parse the skill -> ability map straight from the Foundry config source. */
function extractSkills(repoRoot: string): SkillDef[] {
  const text = readFileSync(
    path.join(repoRoot, 'code', 'config', 'skills.mjs'),
    'utf8',
  );
  const out: SkillDef[] = [];
  // Each skill block: key: { abbreviation: …, ability: "…", … } (no nested braces).
  const re = /(\w+):\s*\{[^{}]*?ability:\s*"(\w+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const key = m[1];
    const ability = ABILITY_MAP[m[2]];
    if (!ability) continue;
    // Title-case the camelCase key, keeping small joining words lowercase.
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .replace(/\b(Of|And|The)\b/g, (w) => w.toLowerCase())
      .trim();
    out.push({ key, label, ability: ability as AbilityKey });
  }
  return out;
}

/** Parse standard array + point-buy costs from the Foundry config source. */
function extractAbilityRules(repoRoot: string): AbilityRules {
  const text = readFileSync(
    path.join(repoRoot, 'code', 'config', 'abilities.mjs'),
    'utf8',
  );
  const arr = text.match(/standardArray:\s*\[([\d,\s]+)\]/);
  const standardArray = arr
    ? arr[1].split(',').map((n) => Number(n.trim()))
    : [16, 14, 14, 13, 10, 8];

  // Require a numeric `points:` so we hit the real config, not the JSDoc typedef
  // (`pointBuy: {points: number, costs: {…}}`).
  const pointBuyBlock = text.match(
    /pointBuy:\s*\{\s*points:\s*\d+,\s*costs:\s*\{([\s\S]*?)\}/,
  );
  const points = Number(text.match(/points:\s*(\d+)/)?.[1] ?? 32);
  const costsBlock = pointBuyBlock?.[1] ?? '';
  const costs: Record<string, number> = {};
  for (const cm of costsBlock.matchAll(/(\d+):\s*(\d+)/g)) {
    costs[cm[1]] = Number(cm[2]);
  }

  const bonuses = (text.match(/bonuses:\s*\[([\d,\s]+)\]/)?.[1] ?? '2, 1')
    .split(',')
    .map((n) => Number(n.trim()));
  const formula = text.match(/formula:\s*"([^"]+)"/)?.[1] ?? '4d6dl';
  const max = Number(text.match(/max:\s*(\d+)/)?.[1] ?? 18);

  return { standardArray, pointBuy: { points, costs }, bonuses, rolling: { formula, max } };
}

// ---------------------------------------------------------------------------
// Write + validate
// ---------------------------------------------------------------------------

function writeData<T>(file: string, schema: z.ZodType<T>, records: T[]): void {
  const parsed = z.array(schema).safeParse(records);
  if (!parsed.success) {
    console.error(`\n✗ Validation failed for ${file}:`);
    console.error(parsed.error.issues.slice(0, 8));
    throw new Error(`Schema validation failed for ${file}`);
  }
  const out = path.join(DATA_DIR, file);
  writeFileSync(out, JSON.stringify(parsed.data, null, 2) + '\n');
  console.log(`  ✓ ${file.padEnd(26)} ${records.length} records`);
}

function main() {
  const { sourceRoot, commit, systemVersion } = ensureSource();
  console.log(`Source: koboldpress/black-flag @ ${commit.slice(0, 10)} (system ${systemVersion})\n`);

  const repoRoot = path.resolve(sourceRoot, '..', '..');
  const index = buildIdIndex(sourceRoot);
  const classDocs = loadDir(path.join(sourceRoot, 'classes'));

  const { classes, subclasses } = extractClasses(classDocs, index);
  const lineages = extractLineages(sourceRoot, index);
  const heritages = extractHeritages(sourceRoot, index);
  const backgrounds = extractBackgrounds(sourceRoot);
  const talents = extractTalents(sourceRoot);
  const equipment = extractEquipment(sourceRoot);
  const features = [...featureMap.values()];
  const skills = extractSkills(repoRoot);
  const abilityRules = extractAbilityRules(repoRoot);

  console.log('Writing src/data/*.open.json:');
  writeData('classes.open.json', classDefSchema, classes);
  writeData('subclasses.open.json', subclassDefSchema, subclasses);
  writeData('features.open.json', featureDefSchema, features);
  writeData('lineages.open.json', lineageDefSchema, lineages);
  writeData('heritages.open.json', heritageDefSchema, heritages);
  writeData('backgrounds.open.json', backgroundDefSchema, backgrounds);
  writeData('talents.open.json', talentDefSchema, talents);
  writeData('equipment.open.json', equipmentDefSchema, equipment);

  // System rules config (not licensed content; written as plain JSON).
  console.log('Writing src/data/*.json (rules config):');
  const skillsParsed = z.array(skillDefSchema).parse(skills);
  writeFileSync(
    path.join(DATA_DIR, 'skills.json'),
    JSON.stringify(skillsParsed, null, 2) + '\n',
  );
  console.log(`  ✓ skills.json                ${skillsParsed.length} records`);
  const abilityRulesParsed = abilityRulesSchema.parse(abilityRules);
  writeFileSync(
    path.join(DATA_DIR, 'abilityRules.json'),
    JSON.stringify(abilityRulesParsed, null, 2) + '\n',
  );
  console.log(`  ✓ abilityRules.json          standard array [${abilityRulesParsed.standardArray}]`);

  // Provenance.
  writeFileSync(
    path.join(DATA_DIR, '_meta.json'),
    JSON.stringify(
      {
        sourceRepo: 'koboldpress/black-flag',
        commit,
        systemVersion,
        generatedAt: new Date().toISOString(),
        counts: {
          classes: classes.length,
          subclasses: subclasses.length,
          features: features.length,
          lineages: lineages.length,
          heritages: heritages.length,
          backgrounds: backgrounds.length,
          talents: talents.length,
          equipment: equipment.length,
        },
        note: 'Open BFRD content (CC-BY 4.0 / ORC). Spells deferred to M7; equipment to M3. Proprietary content lives in *.proprietary.json.',
      },
      null,
      2,
    ) + '\n',
  );

  // Sanity check: all 13 classes have a complete 20-row progression table.
  const incomplete = classes.filter((c) => c.progressionTable.length !== 20);
  if (classes.length !== 13) {
    warn(`Expected 13 classes, got ${classes.length}`);
  }
  if (incomplete.length) {
    warn(`Classes with incomplete progression tables: ${incomplete.map((c) => c.id).join(', ')}`);
  }

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }
  console.log('\nDone.');
}

main();
