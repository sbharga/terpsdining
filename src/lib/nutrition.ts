import type { Json } from './database.types'

export type NutritionDetails = {
  servings: string | null
  servingSize: string | null
  calories: number | null
  nutrients: { name: string; amount: string; dv: string | null }[]
}

export function nutritionDetails(value: Json): NutritionDetails | null {
  const nutrition = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
  if (!nutrition) return null
  const nutrients = Array.isArray(nutrition.nutrients) ? nutrition.nutrients.flatMap(value => {
    const nutrient = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
    return nutrient && typeof nutrient.name === 'string' && typeof nutrient.amount === 'string'
      ? [{ name: nutrient.name, amount: nutrient.amount, dv: typeof nutrient.dv === 'string' ? nutrient.dv : null }]
      : []
  }) : []
  return {
    servings: typeof nutrition.servings === 'string' ? nutrition.servings : null,
    servingSize: typeof nutrition.serving_size === 'string' ? nutrition.serving_size : null,
    calories: typeof nutrition.calories === 'number' ? nutrition.calories : null,
    nutrients,
  }
}

export type PlateTotals = { calories: number; nutrients: { name: string; unit: string; amount: number }[]; counted: number; missing: number }

const AMOUNT = /^(\d+(?:\.\d+)?)\s*(g|mg|mcg|kcal|IU)$/

export function plateTotals(entries: { servings: number; nutrition: NutritionDetails | null }[]): PlateTotals {
  const totals: PlateTotals = { calories: 0, nutrients: [], counted: 0, missing: 0 }
  const byKey = new Map<string, PlateTotals['nutrients'][number]>()
  for (const { servings, nutrition } of entries) {
    if (nutrition === null || nutrition.calories === null) {
      totals.missing += 1
      continue
    }
    totals.counted += 1
    totals.calories += nutrition.calories * servings
    for (const nutrient of nutrition.nutrients) {
      const match = AMOUNT.exec(nutrient.amount)
      if (!match) continue
      const unit = match[2]
      const key = `${nutrient.name}|${unit}`
      let total = byKey.get(key)
      if (!total) {
        total = { name: nutrient.name, unit, amount: 0 }
        byKey.set(key, total)
        totals.nutrients.push(total)
      }
      total.amount += Number(match[1]) * servings
    }
  }
  return totals
}

export function formatAmount(amount: number, unit: string) {
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 1 })}${unit}`
}

export function findNutrient(totals: PlateTotals, name: string) {
  return totals.nutrients.find(n => n.name === name)
}
