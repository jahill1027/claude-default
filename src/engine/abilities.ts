import { abilityRules } from '@/data';
import type { AbilityBlock, AbilityBumps } from '@/schema';

/**
 * Ability-score rules (Section 6.1). Pure functions, no UI, no storage.
 * The standard array, point-buy costs, and creation bonuses come from the
 * generated rules config (BFRD-sourced), never hard-coded here.
 */

/** D&D-style ability modifier. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export const STANDARD_ARRAY = abilityRules.standardArray;
export const POINT_BUY_BUDGET = abilityRules.pointBuy.points;
/** The creation bumps, e.g. [2, 1] -> a +2 and a +1. */
export const ABILITY_BONUSES = abilityRules.bonuses;

/** Point-buy cost of a single score, or Infinity if out of the legal range. */
export function pointBuyCost(score: number): number {
  const cost = abilityRules.pointBuy.costs[String(score)];
  return cost ?? Infinity;
}

export function pointBuyTotal(scores: number[]): number {
  return scores.reduce((sum, s) => sum + pointBuyCost(s), 0);
}

export function pointBuyRemaining(scores: number[]): number {
  return POINT_BUY_BUDGET - pointBuyTotal(scores);
}

/** All scores in range and the full budget spent exactly. */
export function isValidPointBuy(scores: number[]): boolean {
  return (
    scores.every((s) => Number.isFinite(pointBuyCost(s))) &&
    pointBuyTotal(scores) === POINT_BUY_BUDGET
  );
}

/**
 * Whether a creation bump may target a score, per the caps:
 * +2 only to a score of 16 or below, +1 only to a score of 17 or below.
 */
export function canApplyBump(score: number, bonus: number): boolean {
  if (bonus >= 2) return score <= 16;
  return score <= 17;
}

/**
 * Apply the +2 / +1 creation bumps to base abilities, hard-capping each result
 * at 20. The 16/17 eligibility caps are enforced at assignment via canApplyBump.
 */
export function applyBumps(base: AbilityBlock, bumps: AbilityBumps): AbilityBlock {
  const out = { ...base };
  out[bumps.plus2] = Math.min(20, out[bumps.plus2] + 2);
  out[bumps.plus1] = Math.min(20, out[bumps.plus1] + 1);
  return out;
}
