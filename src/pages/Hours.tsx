import { useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHours } from '../api/queries'
import { ErrorNote, Loading, PageTitle } from '../components/UI'
import { HoursBoard } from '../components/HoursViz'
import { addDays, diffDays, formatDay, formatMonthDay, formatWeekday, parseDateParam, relativeDay, todayET, useNowMinutesET } from '../lib/dates'
import { halls } from '../lib/halls'
export default function Hours() {
  const [params, setParams] = useSearchParams()
  const today = todayET()
  const now = useNowMinutesET()
  const date = parseDateParam(params.get('date'), today)
  const weekStart = addDays(today, 7 * Math.floor(diffDays(today, date) / 7))
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const hours = useHours(weekStart, dates[6])
  const dayName = relativeDay(date, today)

  function changeDate(value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value === today) next.delete('date')
      else next.set('date', value)
      return next
    }, { preventScrollReset: true })
  }

  return (
    <>
      <PageTitle title="Hours" />
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">UMD dining hall hours</h1>
        <p className="mt-2 hidden text-muted sm:block">Breakfast, lunch, and dinner times for every dining hall.</p>
      </header>
      <div className="max-w-md rounded-3xl bg-surface p-3 ring-1 ring-line">
        <div className="flex items-center justify-between gap-2 pl-2">
          <p className="text-sm font-semibold">{formatMonthDay(dates[0])} – {formatMonthDay(dates[6])}</p>
          <div className="flex items-center gap-1">
            {date !== today && <button type="button" onClick={() => changeDate(today)} className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-surface-2">Today</button>}
            <button type="button" aria-label="Previous week" onClick={() => changeDate(addDays(date, -7))} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"><ChevronLeft size={18} aria-hidden="true" /></button>
            <button type="button" aria-label="Next week" onClick={() => changeDate(addDays(date, 7))} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"><ChevronRight size={18} aria-hidden="true" /></button>
          </div>
        </div>
        <div role="group" aria-label="Day" className="mt-2 grid grid-cols-7 gap-1">
          {dates.map(day => (
            <button key={day} type="button" aria-pressed={day === date} aria-label={`${formatDay(day)}${day === today ? ', today' : ''}`} onClick={() => changeDate(day)} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl py-2 transition ${day === date ? 'bg-brand text-brand-ink' : 'hover:bg-surface-2'}`}>
              <span className={`text-xs font-medium ${day === date ? '' : 'text-muted'}`}>{formatWeekday(day)}</span>
              <span className="text-lg font-semibold tabular-nums">{Number(day.slice(8))}</span>
              <span aria-hidden="true" className={`h-1 w-1 rounded-full ${day !== today ? 'bg-transparent' : day === date ? 'bg-brand-ink' : 'bg-brand'}`} />
            </button>
          ))}
        </div>
      </div>
      <section className="mt-8" aria-labelledby="hours-day-heading">
        <h2 id="hours-day-heading" className="font-display text-xl font-bold sm:text-2xl">{dayName}{dayName !== formatDay(date) && <span className="font-sans text-base font-medium text-muted"> · {formatDay(date)}</span>}</h2>
        {hours.isError && <ErrorNote retry={hours.refetch} />}
        {hours.isPending && <Loading inline />}
        <div className="mt-4"><HoursBoard halls={halls} rows={hours.isSuccess ? hours.data.filter(row => row.date === date) : undefined} now={date === today ? now : undefined} heading="h3" /></div>
      </section>
    </>
  )
}
