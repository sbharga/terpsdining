import { useState } from 'react'
import { Link } from 'react-router'
import { useQueries } from '@tanstack/react-query'
import { Calculator, ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react'
import { itemQuery } from '../api/queries'
import { findNutrient, formatAmount, nutritionDetails, plateTotals } from '../lib/nutrition'
import { MAX_SERVINGS, readPlate, setServings, updatePlate, usePlate, usePlateServings, type PlateEntry } from '../lib/plate'
import { cardClass, linkClass, tones } from '../lib/theme'
import { Button, Disclosure, ErrorNote, Loading, StatGrid } from './UI'

export function PlateButton({ item }: { item: { id: string; name: string } }) {
  const servings = usePlateServings(item.id)
  if (servings === 0) {
    return <Button size="sm" aria-label={`Add ${item.name} to plate`} onClick={() => updatePlate(setServings(readPlate(), item, 1))}><Plus size={16} aria-hidden="true" />Add</Button>
  }
  const stepClass = 'hit grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface disabled:opacity-40'
  return (
    <div role="group" aria-label={`${item.name} servings`} className="inline-flex items-center rounded-full bg-surface-2 p-0.5">
      <button type="button" aria-label={`Remove one serving of ${item.name}`} onClick={() => updatePlate(setServings(readPlate(), item, servings - 1))} className={stepClass}><Minus size={16} aria-hidden="true" /></button>
      <span aria-live="polite" className="w-6 text-center text-sm font-semibold tabular-nums">{servings}</span>
      <button type="button" aria-label={`Add one serving of ${item.name}`} disabled={servings >= MAX_SERVINGS} onClick={() => updatePlate(setServings(readPlate(), item, servings + 1))} className={stepClass}><Plus size={16} aria-hidden="true" /></button>
    </div>
  )
}

export function PlateBar() {
  const plate = usePlate()
  if (!plate.length) return null
  return <PlateSummary plate={plate} />
}

function PlateSummary({ plate }: { plate: PlateEntry[] }) {
  const [open, setOpen] = useState(false)
  const results = useQueries({ queries: plate.map(entry => itemQuery(entry.id)) })
  const failed = results.filter(result => result.isError)
  const pending = results.some(result => result.isPending)
  const ready = failed.length === 0 && !pending
  const details = plate.map((_, i) => {
    const row = results[i].data
    return row?.nutrition == null ? null : nutritionDetails(row.nutrition)
  })
  const totals = plateTotals(plate.map((entry, i) => ({ servings: entry.servings, nutrition: details[i] })))
  const protein = findNutrient(totals, 'Protein')
  const n = plate.length
  const summary = failed.length
    ? "Couldn't load nutrition"
    : pending
      ? 'Calculating…'
      : `${Math.round(totals.calories)} cal${protein ? ` · ${formatAmount(protein.amount, protein.unit)} protein` : ''}`
  const nutrientValue = (name: string) => {
    const nutrient = findNutrient(totals, name)
    return nutrient ? formatAmount(nutrient.amount, nutrient.unit) : '—'
  }
  const tiles = [
    ['Calories', String(Math.round(totals.calories)), tones.tomato],
    ['Protein', nutrientValue('Protein'), tones.berry],
    ['Carbs', nutrientValue('Total Carbohydrate'), tones.sky],
    ['Fat', nutrientValue('Total Fat'), tones.citrus],
  ] as const

  return (
    <section aria-label="Your plate" className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-canvas/90 px-safe pt-3 pb-safe backdrop-blur-md">
      {open && (
        <div id="plate-panel" className={`mb-3 max-h-[60dvh] overflow-y-auto ${cardClass} p-4`}>
          {failed.length ? <ErrorNote retry={() => failed.forEach(result => void result.refetch())} /> : pending ? <Loading inline /> : <StatGrid stats={tiles} />}
          <ul className="mt-4 divide-y divide-line">
            {plate.map((entry, i) => {
              const calories = details[i]?.calories
              return (
                <li key={entry.id} className="flex items-center gap-3 py-2">
                  <Link to={`/items/${entry.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-brand">{entry.name}</Link>
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    {calories != null ? `${Math.round(calories * entry.servings)} cal` : results[i].isSuccess ? 'No nutrition info' : null}
                  </span>
                  <PlateButton item={entry} />
                </li>
              )
            })}
          </ul>
          {ready && totals.nutrients.length > 0 && (
            <Disclosure className="mt-4" summary={`All nutrition facts (${totals.nutrients.length})`}>
              <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
                {totals.nutrients.map(nutrient => (
                  <div key={`${nutrient.name}|${nutrient.unit}`} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                    <dt>{nutrient.name}</dt>
                    <dd className="shrink-0 text-muted">{formatAmount(nutrient.amount, nutrient.unit)}</dd>
                  </div>
                ))}
              </dl>
            </Disclosure>
          )}
          <p className="mt-4 text-xs text-muted">
            {totals.missing > 0 && `${totals.missing} ${totals.missing === 1 ? 'item has' : 'items have'} no nutrition info and ${totals.missing === 1 ? "isn't" : "aren't"} counted. `}
            Totals use the labeled serving size for each serving; actual portions vary.
          </p>
          <button type="button" onClick={() => updatePlate([])} className={`hit mt-3 inline-flex items-center gap-1 text-sm ${linkClass}`}><X size={14} aria-hidden="true" />Clear plate</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Calculator size={20} aria-hidden="true" className={tones.lime.text} />
        <p className="min-w-0 flex-1 truncate text-sm"><span className="font-semibold text-ink">Your plate</span> · {n} {n === 1 ? 'item' : 'items'} · {summary}</p>
        <Button size="sm" aria-expanded={open} aria-controls="plate-panel" onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Details'}{open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronUp size={14} aria-hidden="true" />}
        </Button>
      </div>
    </section>
  )
}
