import { create } from 'zustand';
import { RULESET_VERSION } from '@/config';
import {
  backgrounds,
  classes,
  heritages,
} from '@/data';
import type { AbilityBlock, AbilityBumps, Character } from '@/schema';

/**
 * In-memory state for the creation wizard. The draft IS a Character (the single
 * source of truth); ids are empty until chosen. Persistence to IndexedDB lands
 * in M4 — for now the draft lives only while the wizard is open.
 */

export type AbilityMethod = 'standard' | 'pointBuy' | 'manual';

function emptyCharacter(id: string): Character {
  const now = new Date().toISOString();
  return {
    id,
    name: '',
    level: 1,
    classId: '',
    lineageId: '',
    heritageId: '',
    backgroundId: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityBumps: { plus2: 'str', plus1: 'con' },
    asiOrTalentChoices: [],
    skillProficiencies: [],
    savingThrowProficiencies: [],
    languages: [],
    talents: [],
    equipment: [],
    hp: { method: 'fixed' },
    meta: { createdAt: now, updatedAt: now, rulesetVersion: RULESET_VERSION },
  };
}

interface DraftState {
  draft: Character;
  abilityMethod: AbilityMethod;
  /** Skills chosen from the class's skill list (kept separate so they can be
   *  recomputed into draft.skillProficiencies alongside heritage/background). */
  classSkills: string[];
  step: number;

  init: (id: string) => void;
  setStep: (n: number) => void;
  patch: (p: Partial<Character>) => void;

  selectClass: (classId: string) => void;
  toggleClassSkill: (key: string) => void;
  selectLineage: (lineageId: string) => void;
  selectHeritage: (heritageId: string) => void;
  selectBackground: (backgroundId: string) => void;

  setAbilityMethod: (m: AbilityMethod) => void;
  setAbilities: (abilities: AbilityBlock) => void;
  setBumps: (bumps: AbilityBumps) => void;

  toggleEquip: (defId: string) => void;
}

export const useDraftStore = create<DraftState>()((set) => {
  /** Recompute the merged skill/language/talent grants from all selections. */
  function recompute(draft: Character, classSkills: string[]): Character {
    const heritage = heritages.find((h) => h.id === draft.heritageId);
    const background = backgrounds.find((b) => b.id === draft.backgroundId);

    const skillSet = new Set<string>(classSkills);
    for (const s of heritage?.skillProficiencies ?? []) skillSet.add(s);
    for (const s of background?.skillProficiencies ?? []) skillSet.add(s);

    const langSet = new Set<string>();
    for (const l of heritage?.languages ?? []) langSet.add(l);
    for (const l of background?.languages ?? []) langSet.add(l);

    const talents = background?.grantedTalent ? [background.grantedTalent] : [];

    return {
      ...draft,
      skillProficiencies: [...skillSet],
      languages: [...langSet],
      talents,
    };
  }

  return {
    draft: emptyCharacter(''),
    abilityMethod: 'standard',
    classSkills: [],
    step: 0,

    init: (id) =>
      set({
        draft: emptyCharacter(id),
        abilityMethod: 'standard',
        classSkills: [],
        step: 0,
      }),

    setStep: (n) => set({ step: Math.max(0, Math.min(7, n)) }),

    patch: (p) =>
      set((s) => ({ draft: { ...s.draft, ...p } })),

    selectClass: (classId) =>
      set((s) => {
        const def = classes.find((c) => c.id === classId);
        if (!def) return {};
        // Smart defaults: saves from the class; bumps toward its primaries.
        const plus2 = def.primaryAbilities[0] ?? 'str';
        const plus1 =
          def.primaryAbilities.find((a) => a !== plus2) ??
          (plus2 === 'con' ? 'str' : 'con');
        const draft = {
          ...s.draft,
          classId,
          subclassId: undefined,
          savingThrowProficiencies: def.savingThrowProficiencies,
          abilityBumps: { plus2, plus1 },
        };
        return { draft: recompute(draft, []), classSkills: [] };
      }),

    toggleClassSkill: (key) =>
      set((s) => {
        const def = classes.find((c) => c.id === s.draft.classId);
        const limit = def?.skillChoices.choose ?? 0;
        const has = s.classSkills.includes(key);
        let next: string[];
        if (has) {
          next = s.classSkills.filter((k) => k !== key);
        } else {
          if (s.classSkills.length >= limit) return {}; // at the cap
          next = [...s.classSkills, key];
        }
        return { classSkills: next, draft: recompute(s.draft, next) };
      }),

    selectLineage: (lineageId) =>
      set((s) => ({ draft: { ...s.draft, lineageId } })),

    selectHeritage: (heritageId) =>
      set((s) => ({
        draft: recompute({ ...s.draft, heritageId }, s.classSkills),
      })),

    selectBackground: (backgroundId) =>
      set((s) => ({
        draft: recompute({ ...s.draft, backgroundId }, s.classSkills),
      })),

    setAbilityMethod: (abilityMethod) => set({ abilityMethod }),

    setAbilities: (abilities) =>
      set((s) => ({ draft: { ...s.draft, abilities } })),

    setBumps: (abilityBumps) =>
      set((s) => ({ draft: { ...s.draft, abilityBumps } })),

    toggleEquip: (defId) =>
      set((s) => {
        const existing = s.draft.equipment.find((e) => e.defId === defId);
        const equipment = existing
          ? s.draft.equipment.filter((e) => e.defId !== defId)
          : [...s.draft.equipment, { defId, quantity: 1, equipped: true }];
        return { draft: { ...s.draft, equipment } };
      }),
  };
});
