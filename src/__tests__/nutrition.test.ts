import { describe, it, expect } from 'vitest';
import { LocalNutritionProvider, calculateNutrition } from '../services/nutrition/provider.js';

describe('LocalNutritionProvider', () => {
  const provider = new LocalNutritionProvider();

  it('finds exact match', () => {
    const result = provider.lookupFood('egg');
    expect(result).not.toBeNull();
    expect(result!.caloriesKcal).toBe(155);
  });

  it('finds partial match', () => {
    const result = provider.lookupFood('grilled chicken breast');
    expect(result).not.toBeNull();
  });

  it('returns null for unknown food', () => {
    expect(provider.lookupFood('xyzzy-unknown-food')).toBeNull();
  });
});

describe('calculateNutrition', () => {
  it('scales linearly with weight', () => {
    const per100 = { caloriesKcal: 100, proteinG: 10, carbsG: 20, fatG: 5 };
    const result = calculateNutrition(per100, 200);
    expect(result.caloriesKcal).toBe(200);
    expect(result.proteinG).toBe(20);
    expect(result.carbsG).toBe(40);
    expect(result.fatG).toBe(10);
  });

  it('handles fractional weights', () => {
    const per100 = { caloriesKcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11 };
    const result = calculateNutrition(per100, 50);
    expect(result.caloriesKcal).toBe(78);
    expect(result.proteinG).toBe(6.5);
  });
});
