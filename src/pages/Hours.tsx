import { Link, useSearchParams } from 'react-router'
import { CalendarDays, Clock } from 'lucide-react'
import { useHours } from '../api/queries'
import { DatePager, ErrorNote, Loading, PageTitle, SectionHeading } from '../components/UI'
import { HoursBoard, WeekChart } from '../components/HoursViz'
import { addDays, formatDay, nowMinutesET, parseDateParam, todayET } from '../lib/dates'
import { halls } from '../lib/halls'
import { hallTone, tones } from '../lib/theme'
export default function Hours() {
  const [params, setParams] = useSearchParams()
  const today = todayET()
  const now = nowMinutesET()
  const todayHours = useHours(today, today)
  const start = parseDateParam(params.get('start'), today)
  const dates = Array.from({ length: 7 }, (_, index) => addDays(start, index))
  const hours = useHours(start, dates[6])

  function changeStart(date: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      next.set('start', date)
      return next
    }, { preventScrollReset: true })
  }

  return (
    <>
      <PageTitle title="Hours" />
      <h1 className="font-display text-4xl font-extrabold tracking-tight">UMD dining hall hours</h1>
      <p className="mt-2 text-muted">Meal times for every dining hall, a week at a glance.</p>

      <section className="mt-8" aria-labelledby="hours-today-heading">
        <SectionHeading id="hours-today-heading" icon={Clock} tone={tones.citrus}>Today · {formatDay(today)}</SectionHeading>
        {todayHours.isError && <ErrorNote retry={todayHours.refetch} />}
        <div className="mt-4"><HoursBoard halls={halls} rows={todayHours.isSuccess ? todayHours.data : undefined} now={now} heading="h3" /></div>
      </section>

      <section className="mt-12" aria-labelledby="hours-week-heading">
        <SectionHeading id="hours-week-heading" icon={CalendarDays} tone={tones.sky}>Hours by day</SectionHeading>
        <div className="mt-4"><DatePager date={start} onChange={changeStart} step={7} /></div>
        <p className="mt-2 text-sm text-muted">{formatDay(start)} – {formatDay(dates[6])}</p>

        <div className="mt-6 space-y-4">
          {hours.isError && <ErrorNote retry={hours.refetch} />}
          {hours.isPending && <Loading />}
        </div>

        {hours.isSuccess && halls.map(hall => (
          <section key={hall.id} className="mt-8 overflow-hidden rounded-3xl bg-surface ring-1 ring-line" aria-labelledby={`hours-${hall.slug}`}>
            <h3 id={`hours-${hall.slug}`} className="flex items-center gap-3 px-5 pt-4 font-display text-xl font-bold">
              <span aria-hidden="true" className={`h-3 w-3 rounded-full ${hallTone(hall.slug).dot}`} /><Link to={`/halls/${hall.slug}`} className="hover:text-brand">{hall.name}</Link>
            </h3>
            <WeekChart hall={hall} dates={dates} rows={hours.data} today={today} now={now} />
          </section>
        ))}
      </section>
    </>
  )
}
