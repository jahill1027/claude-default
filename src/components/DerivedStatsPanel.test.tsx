import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Character } from '@/schema';
import { DerivedStatsPanel } from './DerivedStatsPanel';

/** Ties the UI to the engine: the worked fighter's AC/HP must render. */
const fighter: Character = {
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
  skillProficiencies: ['athletics'],
  savingThrowProficiencies: ['str', 'con'],
  languages: [],
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

describe('DerivedStatsPanel', () => {
  it('renders the derived AC and HP', () => {
    render(<DerivedStatsPanel character={fighter} />);
    // AC 16
    expect(screen.getByText('Armor Class').previousSibling).toHaveTextContent('16');
    // HP 12
    expect(screen.getByText('Hit Points').previousSibling).toHaveTextContent('12');
    // A trained skill renders
    expect(screen.getByText(/Athletics/)).toBeInTheDocument();
  });
});
