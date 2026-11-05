import { Ban, ChevronDown, ListFilter, X } from 'lucide-react'
import { Button, Chip, DietIcon } from './UI'
import type { FilterParams } from '../lib/filters'
import { cardClass, dietTone, linkClass, overlineClass } from '../lib/theme'

const diets = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'halal', label: 'Halal' },
]

export function FiltersButton({ open, active, onToggle }: { open: boolean; active: number; onToggle: () => void }) {
  return (
    <Button aria-expanded={open} aria-controls="filter-panel" onClick={onToggle}>
      <ListFilter size={16} aria-hidden="true" />Filters
      {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-ink">{active}<span className="sr-only"> active</span></span>}
      <ChevronDown size={14} aria-hidden="true" className={`transition ${open ? 'rotate-180' : ''}`} />
    </Button>
  )
}

export function FiltersPanel({ allergens, filters }: { allergens: string[]; filters: FilterParams }) {
  const { diet, avoid, active, toggle, clear } = filters
  return (
    <div id="filter-panel" className={`mt-3 space-y-4 ${cardClass} p-4`}>
      <div role="group" aria-labelledby="filter-diet-label">
        <p id="filter-diet-label" className={overlineClass}>Diet</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {diets.map(tag => <Chip key={tag.value} tone={dietTone(tag.value)} pressed={diet.includes(tag.value)} onClick={() => toggle('diet', tag.value)}><DietIcon tag={tag.value} size={14} />{tag.label}</Chip>)}
        </div>
      </div>
      {(allergens.length > 0 || avoid.length > 0) && (
        <div role="group" aria-labelledby="filter-avoid-label">
          <p id="filter-avoid-label" className={overlineClass}>Avoid allergens</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...new Set([...allergens, ...avoid])].map(tag => <Chip key={tag} tone="danger" pressed={avoid.includes(tag)} onClick={() => toggle('avoid', tag)}>{avoid.includes(tag) && <Ban size={14} aria-hidden="true" />}{tag.replace(/\b\w/g, letter => letter.toUpperCase())}</Chip>)}
          </div>
        </div>
      )}
      {active > 0 && <button type="button" onClick={clear} className={`hit inline-flex items-center gap-1 text-sm ${linkClass}`}><X size={14} aria-hidden="true" />Clear all</button>}
    </div>
  )
}
