export interface NutritionPer100g {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionDataProvider {
  lookupFood(name: string): NutritionPer100g | null;
}

const DATABASE: Record<string, NutritionPer100g> = {
  egg: { caloriesKcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11 },
  'white rice': { caloriesKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  'brown rice': { caloriesKcal: 123, proteinG: 2.7, carbsG: 26, fatG: 1 },
  'chicken breast': { caloriesKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  'salmon': { caloriesKcal: 208, proteinG: 20, carbsG: 0, fatG: 13 },
  'banana': { caloriesKcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3 },
  'apple': { caloriesKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2 },
  'oats': { caloriesKcal: 389, proteinG: 17, carbsG: 66, fatG: 7 },
  'milk': { caloriesKcal: 42, proteinG: 3.4, carbsG: 5, fatG: 1 },
  'greek yogurt': { caloriesKcal: 59, proteinG: 10, carbsG: 3.6, fatG: 0.4 },
  'broccoli': { caloriesKcal: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4 },
  'sweet potato': { caloriesKcal: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1 },
  'avocado': { caloriesKcal: 160, proteinG: 2, carbsG: 9, fatG: 15 },
  'almonds': { caloriesKcal: 579, proteinG: 21, carbsG: 22, fatG: 50 },
  'peanut butter': { caloriesKcal: 588, proteinG: 25, carbsG: 20, fatG: 50 },
  'whole wheat bread': { caloriesKcal: 247, proteinG: 13, carbsG: 41, fatG: 3.4 },
  'pasta': { caloriesKcal: 131, proteinG: 5, carbsG: 25, fatG: 1.1 },
  'beef': { caloriesKcal: 250, proteinG: 26, carbsG: 0, fatG: 15 },
  'tofu': { caloriesKcal: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8 },
  'carrot': { caloriesKcal: 41, proteinG: 0.9, carbsG: 10, fatG: 0.2 },
  'spinach': { caloriesKcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4 },
  'tomato': { caloriesKcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  'orange': { caloriesKcal: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1 },
  'strawberry': { caloriesKcal: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3 },
  'blueberry': { caloriesKcal: 57, proteinG: 0.7, carbsG: 14, fatG: 0.3 },
  'cheddar cheese': { caloriesKcal: 403, proteinG: 25, carbsG: 1.3, fatG: 33 },
  'cottage cheese': { caloriesKcal: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3 },
  'turkey': { caloriesKcal: 135, proteinG: 30, carbsG: 0, fatG: 1.7 },
  'tuna': { caloriesKcal: 132, proteinG: 28, carbsG: 0, fatG: 1 },
  'shrimp': { caloriesKcal: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3 },
  'lentils': { caloriesKcal: 116, proteinG: 9, carbsG: 20, fatG: 0.4 },
  'chickpeas': { caloriesKcal: 164, proteinG: 9, carbsG: 27, fatG: 2.6 },
  'quinoa': { caloriesKcal: 120, proteinG: 4.4, carbsG: 21, fatG: 1.9 },
  'honey': { caloriesKcal: 304, proteinG: 0.3, carbsG: 82, fatG: 0 },
  'olive oil': { caloriesKcal: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  'butter': { caloriesKcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81 },
  'dark chocolate': { caloriesKcal: 546, proteinG: 4.9, carbsG: 61, fatG: 31 },
  'protein powder': { caloriesKcal: 400, proteinG: 80, carbsG: 5, fatG: 5 },
};

export class LocalNutritionProvider implements NutritionDataProvider {
  lookupFood(name: string): NutritionPer100g | null {
    const key = name.toLowerCase().trim();
    if (DATABASE[key]) return DATABASE[key];
    for (const [dbKey, value] of Object.entries(DATABASE)) {
      if (key.includes(dbKey) || dbKey.includes(key)) return value;
    }
    return null;
  }
}

export function calculateNutrition(
  per100g: NutritionPer100g,
  weightGrams: number,
): NutritionPer100g {
  const factor = weightGrams / 100;
  return {
    caloriesKcal: Math.round(per100g.caloriesKcal * factor),
    proteinG: Math.round(per100g.proteinG * factor * 10) / 10,
    carbsG: Math.round(per100g.carbsG * factor * 10) / 10,
    fatG: Math.round(per100g.fatG * factor * 10) / 10,
  };
}
