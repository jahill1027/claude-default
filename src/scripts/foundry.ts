/**
 * Helpers for ingesting the open Black Flag Reference Document content from
 * Kobold Press's open-source Foundry VTT system.
 *
 *   https://github.com/koboldpress/black-flag  (MIT-licensed code; the rules
 *   content under packs/_source is the open BFRD, CC-BY 4.0 / ORC).
 *
 * We read packs/_source JSON (the un-compiled compendium source), normalize it
 * into the app schema, and tag every record source: 'open'. Nothing here writes
 * data — that is ingest.ts. These functions only locate, load, and reshape.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');

export const BLACK_FLAG_REPO = 'https://github.com/koboldpress/black-flag.git';
/** Branch/tag to clone. We record the resolved commit SHA in _meta.json. */
export const BLACK_FLAG_REF = 'main';

const CACHE_DIR = path.join(REPO_ROOT, '.cache', 'black-flag');

/** Clone (shallow) the Foundry repo into .cache if absent; return packs/_source. */
export function ensureSource(): { sourceRoot: string; commit: string; systemVersion: string } {
  if (!existsSync(path.join(CACHE_DIR, 'system.json'))) {
    mkdirSync(path.dirname(CACHE_DIR), { recursive: true });
    console.log(`Cloning ${BLACK_FLAG_REPO} (${BLACK_FLAG_REF}) into .cache …`);
    execFileSync(
      'git',
      ['clone', '--depth', '1', '--branch', BLACK_FLAG_REF, BLACK_FLAG_REPO, CACHE_DIR],
      { stdio: 'inherit' },
    );
  }
  const commit = execFileSync('git', ['-C', CACHE_DIR, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const systemVersion = JSON.parse(
    readFileSync(path.join(CACHE_DIR, 'system.json'), 'utf8'),
  ).version as string;
  return { sourceRoot: path.join(CACHE_DIR, 'packs', '_source'), commit, systemVersion };
}

/** A Foundry document as stored in packs/_source. Loosely typed on purpose. */
export interface FoundryDoc {
  _id: string;
  name: string;
  type: string;
  system: Record<string, any>;
  [key: string]: unknown;
}

/** Recursively load every *.json under dir, skipping Foundry _folder.json. */
export function loadDir(dir: string): FoundryDoc[] {
  const out: FoundryDoc[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...loadDir(full));
    } else if (entry.endsWith('.json') && entry !== '_folder.json') {
      out.push(JSON.parse(readFileSync(full, 'utf8')) as FoundryDoc);
    }
  }
  return out;
}

/** Index every item doc by _id so grantFeatures UUIDs can be resolved. */
export function buildIdIndex(sourceRoot: string): Map<string, FoundryDoc> {
  const index = new Map<string, FoundryDoc>();
  for (const doc of loadDir(sourceRoot)) {
    if (doc._id) index.set(doc._id, doc);
  }
  return index;
}

/** The trailing id of a Foundry UUID, e.g. Compendium.x.y.Item.<id> -> <id>. */
export function uuidToId(uuid: string): string {
  return uuid.split('.').pop() ?? uuid;
}

export const ABILITY_MAP: Record<string, string> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha',
};

/** Standard 5e-compatible proficiency bonus by character level (per BFRD). */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

/** Lowercase, hyphenated slug for stable ids. */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&mdash;': '—',
  '&ndash;': '–',
  '&nbsp;': ' ',
  '&times;': '×',
  '&hellip;': '…',
};

/**
 * Convert a Foundry HTML/enricher rules string into clean plain text suitable
 * for display in the builder. Resolves @Embed/@UUID/&Reference enrichers to
 * their labels, turns block tags into line breaks, strips remaining tags, and
 * decodes common entities.
 */
export function cleanText(html: string | undefined | null): string {
  if (!html) return '';
  let s = html;
  // Foundry enrichers with a {label} keep the label; without one, drop them.
  s = s.replace(/[@&]\w+\[[^\]]*\]\{([^}]*)\}/g, '$1');
  s = s.replace(/[@&]\w+\[[^\]]*\]/g, '');
  // Inline roll expressions like [[/r 1d8]] — drop entirely.
  s = s.replace(/\[\[[^\]]*\]\]/g, '');
  // Block-level tags -> newlines; list items -> bullets.
  s = s.replace(/<li[^>]*>/gi, '\n• ');
  s = s.replace(/<\/(p|div|li|tr|h[1-6]|ul|ol|table)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  // Strip all remaining tags.
  s = s.replace(/<[^>]+>/g, '');
  // Decode entities.
  s = s.replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
  // Tidy whitespace.
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s;
}

/** Pull the typed advancement entries off a Foundry item (value is a map). */
export function advancements(doc: FoundryDoc): Array<Record<string, any>> {
  const adv = doc.system?.advancement;
  if (!adv || typeof adv !== 'object') return [];
  return Object.values(adv) as Array<Record<string, any>>;
}

/** Level value of an advancement entry (handles { value } and class restriction). */
export function advLevel(a: Record<string, any>): number | undefined {
  const lvl = a.level;
  if (typeof lvl === 'number') return lvl;
  if (lvl && typeof lvl === 'object') return lvl.value;
  return undefined;
}

/** classRestriction on an advancement: 'original' | 'multiclass' | '' | undefined. */
export function advRestriction(a: Record<string, any>): string {
  const lvl = a.level;
  if (lvl && typeof lvl === 'object') return lvl.classRestriction ?? '';
  return '';
}
