import type { HallState, Meal } from './hours'
export type ToneName = 'tomato' | 'citrus' | 'lime' | 'mint' | 'sky' | 'grape' | 'berry'
export type Tone = { solid: string; soft: string; text: string; dot: string; border: string }
export const tones: Record<ToneName, Tone> = {
  tomato: { solid: 'bg-red-600', soft: 'bg-red-50 text-red-900 dark:bg-red-400/15 dark:text-red-200', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-300 dark:border-red-400/50' },
  citrus: { solid: 'bg-amber-700', soft: 'bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-400/50' },
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
export const statusStyle: Record<HallState, { text: string; dot: string }> = {
  open: { text: 'text-emerald-800', dot: 'bg-emerald-500' },
  upcoming: { text: 'text-amber-800', dot: 'bg-amber-500' },
  closed: { text: 'text-stone-600', dot: 'bg-stone-400' },
  tbd: { text: 'text-stone-600', dot: 'bg-stone-400' },
}
export const todayRowClass = 'bg-orange-50/70 dark:bg-orange-400/10'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'sm' | 'icon' | 'icon-sm'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-ink hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'border border-danger text-danger hover:bg-danger-soft',
}
const buttonSizes: Record<ButtonSize, string> = { md: 'h-11 gap-2 px-5 text-sm', sm: 'hit h-9 gap-1.5 px-3.5 text-sm', icon: 'h-11 w-11', 'icon-sm': 'hit h-9 w-9' }
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return `inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition disabled:opacity-60 ${buttonVariants[variant]} ${buttonSizes[size]}`
}
export const cardClass = 'rounded-3xl bg-surface ring-1 ring-line'
export const titleClass = 'font-display text-3xl font-extrabold tracking-tight sm:text-4xl'
export const overlineClass = 'text-xs font-semibold uppercase tracking-wider text-muted'
export const linkClass = 'font-semibold text-brand underline underline-offset-4 hover:no-underline'
