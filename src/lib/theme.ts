import type { HallState, Meal } from './hours'
export type ToneName = 'tomato' | 'citrus' | 'lime' | 'mint' | 'sky' | 'grape' | 'berry'
export type Tone = { solid: string; soft: string; text: string; dot: string; border: string }
export const tones: Record<ToneName, Tone> = {
  tomato: { solid: 'bg-tone-tomato', soft: 'bg-tone-tomato-soft text-tone-tomato-ink', text: 'text-tone-tomato-ink', dot: 'bg-tone-tomato-dot', border: 'border-tone-tomato-line' },
  citrus: { solid: 'bg-tone-citrus', soft: 'bg-tone-citrus-soft text-tone-citrus-ink', text: 'text-tone-citrus-ink', dot: 'bg-tone-citrus-dot', border: 'border-tone-citrus-line' },
  lime: { solid: 'bg-tone-lime', soft: 'bg-tone-lime-soft text-tone-lime-ink', text: 'text-tone-lime-ink', dot: 'bg-tone-lime-dot', border: 'border-tone-lime-line' },
  mint: { solid: 'bg-tone-mint', soft: 'bg-tone-mint-soft text-tone-mint-ink', text: 'text-tone-mint-ink', dot: 'bg-tone-mint-dot', border: 'border-tone-mint-line' },
  sky: { solid: 'bg-tone-sky', soft: 'bg-tone-sky-soft text-tone-sky-ink', text: 'text-tone-sky-ink', dot: 'bg-tone-sky-dot', border: 'border-tone-sky-line' },
  grape: { solid: 'bg-tone-grape', soft: 'bg-tone-grape-soft text-tone-grape-ink', text: 'text-tone-grape-ink', dot: 'bg-tone-grape-dot', border: 'border-tone-grape-line' },
  berry: { solid: 'bg-tone-berry', soft: 'bg-tone-berry-soft text-tone-berry-ink', text: 'text-tone-berry-ink', dot: 'bg-tone-berry-dot', border: 'border-tone-berry-line' },
}
const toneOrder: ToneName[] = ['tomato', 'citrus', 'lime', 'mint', 'sky', 'grape', 'berry']
const hallTones: Record<string, ToneName> = { 'south-campus': 'tomato', yahentamitsi: 'sky', '251-north': 'citrus' }
export function hallTone(slug: string): Tone { return tones[hallTones[slug] ?? 'mint'] }
export const mealTones: Record<Meal, ToneName> = { Breakfast: 'citrus', Lunch: 'sky', Dinner: 'grape' }
const dietTones: Record<string, ToneName> = { vegan: 'lime', vegetarian: 'mint', halal: 'sky' }
export function dietTone(tag: string): Tone { return tones[dietTones[tag] ?? 'mint'] }
export function nameTone(name: string): Tone {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return tones[toneOrder[hash % toneOrder.length]]
}
export const statusStyle: Record<HallState, { text: string; dot: string }> = {
  open: { text: 'text-success', dot: 'bg-success' },
  upcoming: { text: 'text-warning', dot: 'bg-warning' },
  closed: { text: 'text-muted', dot: 'bg-muted' },
  tbd: { text: 'text-muted', dot: 'bg-muted' },
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onColor'
export type ButtonSize = 'md' | 'sm' | 'icon' | 'icon-sm'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-ink hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'border border-danger text-danger hover:bg-danger-soft',
  onColor: 'bg-white/45 text-on-tone ring-1 ring-inset ring-black/10 hover:bg-white/65',
}
const buttonSizes: Record<ButtonSize, string> = { md: 'h-11 gap-2 px-5 text-sm', sm: 'hit h-9 gap-1.5 px-3.5 text-sm', icon: 'h-11 w-11', 'icon-sm': 'hit h-9 w-9' }
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return `inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition disabled:opacity-60 ${buttonVariants[variant]} ${buttonSizes[size]}`
}
export const cardClass = 'rounded-3xl bg-surface ring-1 ring-line'
export const titleClass = 'font-display text-3xl font-extrabold tracking-tight sm:text-4xl'
export const overlineClass = 'text-xs font-semibold uppercase tracking-wider text-muted'
export const linkClass = 'font-semibold text-brand underline underline-offset-4 hover:no-underline'
