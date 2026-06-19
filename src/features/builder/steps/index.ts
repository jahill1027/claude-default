import type { ComponentType } from 'react';
import { classes } from '@/data';
import type { Character } from '@/schema';
import {
  BackgroundStep,
  ClassStep,
  ConceptStep,
  HeritageStep,
  LineageStep,
} from './PickerSteps';
import { AbilitiesStep } from './AbilitiesStep';
import { EquipmentStep } from './EquipmentStep';
import { ReviewStep } from './ReviewStep';

export interface WizardStep {
  key: string;
  title: string;
  Component: ComponentType;
  /** Whether the step has enough input to count as done (drives the rail). */
  complete: (draft: Character, classSkills: string[]) => boolean;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    key: 'concept',
    title: 'Concept',
    Component: ConceptStep,
    complete: (d) => d.name.trim().length > 0,
  },
  {
    key: 'class',
    title: 'Class',
    Component: ClassStep,
    complete: (d, classSkills) => {
      const def = classes.find((c) => c.id === d.classId);
      return Boolean(def) && classSkills.length === (def?.skillChoices.choose ?? 0);
    },
  },
  {
    key: 'abilities',
    title: 'Ability scores',
    Component: AbilitiesStep,
    complete: () => true,
  },
  {
    key: 'lineage',
    title: 'Lineage',
    Component: LineageStep,
    complete: (d) => d.lineageId.length > 0,
  },
  {
    key: 'heritage',
    title: 'Heritage',
    Component: HeritageStep,
    complete: (d) => d.heritageId.length > 0,
  },
  {
    key: 'background',
    title: 'Background',
    Component: BackgroundStep,
    complete: (d) => d.backgroundId.length > 0,
  },
  {
    key: 'equipment',
    title: 'Equipment',
    Component: EquipmentStep,
    complete: () => true,
  },
  {
    key: 'review',
    title: 'Review',
    Component: ReviewStep,
    complete: () => true,
  },
];
