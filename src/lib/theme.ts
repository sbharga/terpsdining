import type { Meal } from './hours'
export type ToneName = 'tomato' | 'citrus' | 'lime' | 'mint' | 'sky' | 'grape' | 'berry'
export type Tone = { solid: string; soft: string; text: string; dot: string; border: string }
export const tones: Record<ToneName, Tone> = {
  tomato: { solid: 'bg-red-600', soft: 'bg-red-50 text-red-900 dark:bg-red-400/15 dark:text-red-200', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-300 dark:border-red-400/50' },
  citrus: { solid: 'bg-amber-600', soft: 'bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-400/50' },
  lime: { solid: 'bg-lime-700', soft: 'bg-lime-50 text-lime-900 dark:bg-lime-400/15 dark:text-lime-200', text: 'text-green-700 dark:text-lime-300', dot: 'bg-lime-500', border: 'border-lime-300 dark:border-lime-400/50' },
  mint: { solid: 'bg-emerald-700', soft: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-300 dark:border-emerald-400/50' },
  sky: { solid: 'bg-sky-700', soft: 'bg-sky-50 text-sky-900 dark:bg-sky-400/15 dark:text-sky-200', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', border: 'border-sky-300 dark:border-sky-400/50' },
  grape: { solid: 'bg-violet-700', soft: 'bg-violet-50 text-violet-900 dark:bg-violet-400/15 dark:text-violet-200', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', border: 'border-violet-300 dark:border-violet-400/50' },
  berry: { solid: 'bg-fuchsia-700', soft: 'bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-400/15 dark:text-fuchsia-200', text: 'text-fuchsia-700 dark:text-fuchsia-300', dot: 'bg-fuchsia-500', border: 'border-fuchsia-300 dark:border-fuchsia-400/50' },
}
const toneOrder: ToneName[] = ['tomato', 'citrus', 'lime', 'mint', 'sky', 'grape', 'berry']
const hallTones: Record<string, ToneName> = { 'south-campus': 'citrus', yahentamitsi: 'lime', '251-north': 'berry' }
export function hallTone(slug: string): Tone { return tones[hallTones[slug] ?? 'sky'] }
export const mealTones: Record<Meal, ToneName> = { Breakfast: 'citrus', Lunch: 'sky', Dinner: 'grape' }
const dietTones: Record<string, ToneName> = { vegan: 'lime', vegetarian: 'mint', halal: 'sky' }
export function dietTone(tag: string): Tone { return tones[dietTones[tag] ?? 'mint'] }
export function nameTone(name: string): Tone {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return tones[toneOrder[hash % toneOrder.length]]
}
