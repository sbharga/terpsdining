import { useLoaderData, Link } from 'react-router';
import {
  getTodayHours,
  getMenusByPeriod,
  groupMenusByHall,
  getCurrentMealPeriod,
  todayISO,
} from '../api/queries';
import { formatFullDate } from '../utils/date';
import FoodCard from '../components/food/FoodCard';
import StatusBadge from '../components/ui/StatusBadge';
import { Card } from '../components/ui/Card';
import { DINING_HALLS } from '../config/halls';

export async function loader({ request }) {
  const today = todayISO();
  const url = new URL(request.url);
  const param = url.searchParams.get('period');
  const VALID = ['Breakfast', 'Lunch', 'Dinner'];
  const mealPeriod = (param && VALID.includes(param)) ? param : getCurrentMealPeriod();

  const [hours, menus] = await Promise.all([
    getTodayHours(),
    getMenusByPeriod(today, mealPeriod),
  ]);

  const menusByHall = groupMenusByHall(menus);
  Object.values(menusByHall).forEach((hall) => {
    hall.foods.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    hall.totalCount = hall.foods.length;
    hall.foods = hall.foods.slice(0, 8);
  });

  return { hours, menusByHall, mealPeriod, today };
}


const MEAL_PERIODS = ['Breakfast', 'Lunch', 'Dinner'];

function HoursRow({ label, value }) {
  const closed = !value || value === 'Closed';
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={closed ? 'text-gray-400 italic' : 'font-medium tabular-nums'}>
        {value || 'Closed'}
      </span>
    </div>
  );
}

function HoursCard({ row }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">
          {row.dining_halls?.name ?? 'Unknown Hall'}
        </h3>
        <StatusBadge hoursRow={row} />
      </div>

      <div>
        <HoursRow label="Breakfast" value={row.breakfast} />
        <HoursRow label="Lunch" value={row.lunch} />
        <HoursRow label="Dinner" value={row.dinner} />
      </div>
    </Card>
  );
}


export default function HomePage() {
  const { hours, menusByHall, mealPeriod, today } = useLoaderData();
  const hallSlugs = DINING_HALLS.map(h => h.slug).filter(slug => menusByHall[slug]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Today's Dining</h1>
        <p className="text-gray-500 text-sm mt-1">{formatFullDate(today)}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Hours Today</h2>
        {hours.length === 0 ? (
          <p className="text-gray-400 text-sm">Hours not yet available for today.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {DINING_HALLS
              .map(h => hours.find(r => r.dining_halls?.slug === h.slug))
              .filter(Boolean)
              .map((row) => (
                <HoursCard key={row.id} row={row} />
              ))
            }
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{mealPeriod} Menu</h2>

          <div className="flex gap-1.5 text-xs">
            {MEAL_PERIODS.map((p) => (
              <Link
                key={p}
                to={`/?period=${p}`}
                className={`px-2.5 py-1 rounded-full border font-medium ${p === mealPeriod
                    ? 'bg-primary text-white border-primary'
                    : 'text-gray-400 border-gray-200 bg-white hover:border-gray-400 hover:text-gray-600'
                  }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>

        {hallSlugs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-400 text-sm">
              Menu not yet available. Check back back later.
            </p>
          </div>
        ) : (
          hallSlugs.map((slug) => {
            const { hall, foods, totalCount } = menusByHall[slug];
            return (
              <div key={slug} className="mb-8">
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {hall.name}
                  </h3>
                  {totalCount > 8 && (
                    <span className="text-xs text-gray-400">
                      Top 8 of {totalCount} items
                    </span>
                  )}
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {foods.map((food) => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
