import { describe, expect, it } from 'vitest';
import {
  STANDARD_ARRAY,
  abilityModifier,
  applyBumps,
  canApplyBump,
  isValidPointBuy,
  pointBuyCost,
  pointBuyRemaining,
  pointBuyTotal,
} from './abilities';

describe('abilityModifier', () => {
  it('matches the standard table', () => {
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(16)).toBe(3);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(7)).toBe(-2);
    expect(abilityModifier(20)).toBe(5);
  });
});

describe('standard array', () => {
  it('is the BFRD array [16,14,14,13,10,8]', () => {
    expect(STANDARD_ARRAY).toEqual([16, 14, 14, 13, 10, 8]);
  });
});

describe('point buy', () => {
  it('costs scores per the BFRD table', () => {
    expect(pointBuyCost(8)).toBe(0);
    expect(pointBuyCost(13)).toBe(5);
    expect(pointBuyCost(14)).toBe(7);
    expect(pointBuyCost(18)).toBe(16);
  });

  it('treats out-of-range scores as invalid (Infinity)', () => {
    expect(pointBuyCost(7)).toBe(Infinity);
    expect(pointBuyCost(19)).toBe(Infinity);
  });

  it('spends exactly 32 on the standard array spread', () => {
    const spread = [16, 14, 14, 13, 10, 8];
    expect(pointBuyTotal(spread)).toBe(32);
    expect(pointBuyRemaining(spread)).toBe(0);
    expect(isValidPointBuy(spread)).toBe(true);
  });

  it('rejects an underspent or overspent build', () => {
    expect(isValidPointBuy([8, 8, 8, 8, 8, 8])).toBe(false); // 0 points
    expect(isValidPointBuy([18, 18, 18, 8, 8, 8])).toBe(false); // 48 points
  });
});

describe('creation bumps', () => {
  it('enforces the 16/17 caps on eligibility', () => {
    expect(canApplyBump(16, 2)).toBe(true);
    expect(canApplyBump(17, 2)).toBe(false);
    expect(canApplyBump(17, 1)).toBe(true);
    expect(canApplyBump(18, 1)).toBe(false);
  });

  it('applies +2/+1 and hard-caps results at 20', () => {
    const base = { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 };
    const bumped = applyBumps(base, { plus2: 'str', plus1: 'con' });
    expect(bumped.str).toBe(17);
    expect(bumped.con).toBe(14);

    const high = { str: 19, dex: 14, con: 19, int: 10, wis: 12, cha: 8 };
    const capped = applyBumps(high, { plus2: 'str', plus1: 'con' });
    expect(capped.str).toBe(20); // 19 + 2 capped at 20
    expect(capped.con).toBe(20); // 19 + 1 capped at 20
  });
});
