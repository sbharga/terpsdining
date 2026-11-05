import { useSearchParams } from 'react-router'

export type FilterParams = {
  diet: string[]
  avoid: string[]
  active: number
  toggle: (key: 'diet' | 'avoid', value: string) => void
  clear: () => void
}

export function useFilterParams(): FilterParams {
  const [params, setParams] = useSearchParams()
  const diet = (params.get('diet') ?? '').split(',').filter(Boolean)
  const avoid = (params.get('avoid') ?? '').split(',').filter(Boolean)

  function toggle(key: 'diet' | 'avoid', value: string) {
    const selected = key === 'diet' ? diet : avoid
    const nextValue = (selected.includes(value) ? selected.filter(tag => tag !== value) : [...selected, value]).join(',')
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (nextValue) next.set(key, nextValue)
      else next.delete(key)
      next.delete('page')
      return next
    }, { preventScrollReset: true })
  }

  function clear() {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      next.delete('diet')
      next.delete('avoid')
      next.delete('page')
      return next
    }, { preventScrollReset: true })
  }

  return { diet, avoid, active: diet.length + avoid.length, toggle, clear }
}
