import { useState } from 'react';
import { useLoaderData, useFetcher, useNavigate } from 'react-router';
import { supabase } from '../api/supabase';
import { DINING_HALLS } from '../config/halls';
import {
  getFoodById,
  getFoodMenuHistory,
  getFoodRatings,
  getTodayAppearancesForFood,
  getUserRatingForFood,
  upsertRating,
} from '../api/queries';
import { formatDateLabel } from '../utils/date';
import RatingStars from '../components/food/RatingStars';
import AllergenIcons from '../components/food/AllergenIcons';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import ImageWithFallback from '../components/ui/ImageWithFallback';


export async function loader({ params }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [food, history, ratings, todayAppearances, userRating] = await Promise.all([
    getFoodById(params.id),
    getFoodMenuHistory(params.id),
    getFoodRatings(params.id),
    getTodayAppearancesForFood(params.id),
    user ? getUserRatingForFood(user.id, params.id) : Promise.resolve(null),
  ]);

  return { food, history, ratings, todayAppearances, user, userRating };
}


export async function action({ request, params }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response('Unauthorized', { status: 401 });

  const formData = await request.formData();
  await upsertRating(user.id, params.id, {
    ratingOverall: Number(formData.get('ratingOverall')),
    ratingTaste:   Number(formData.get('ratingTaste')),
    ratingHealth:  Number(formData.get('ratingHealth')),
  });

  return null;
}


function StarPicker({ name, defaultValue = 0 }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => setValue(n)}
            className="sr-only"
            required
          />
          <span
            className={`text-2xl leading-none select-none transition-colors ${
              n <= value ? 'text-accent' : 'text-gray-300 hover:text-accent/60'
            }`}
          >
            ★
          </span>
        </label>
      ))}
    </div>
  );
}

function RatingForm({ userRating, foodId }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const hasRating = !!userRating;

  return (
    <fetcher.Form method="post" action={`/food/${foodId}`} className="space-y-3">
      {[
        { label: 'Overall', name: 'ratingOverall', default: userRating?.rating_overall },
        { label: 'Taste',   name: 'ratingTaste',   default: userRating?.rating_taste },
        { label: 'Health',  name: 'ratingHealth',  default: userRating?.rating_health },
      ].map(({ label, name, default: def }) => (
        <div key={name} className="flex items-center gap-4">
          <span className="text-sm text-gray-500 w-16 shrink-0">{label}</span>
          <StarPicker name={name} defaultValue={def ?? 0} />
        </div>
      ))}

      <Button type="submit" loading={isSubmitting} className="mt-1">
        {hasRating ? 'Update Rating' : 'Submit Rating'}
      </Button>
    </fetcher.Form>
  );
}

function BreakdownRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value} / 5</span>
    </div>
  );
}


function buildBreakdown(ratings) {
  if (!ratings.length) return null;
  const avg = (key) => {
    const vals = ratings.map((r) => r[key]).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  };
  return {
    overall: avg('rating_overall'),
    taste:   avg('rating_taste'),
    health:  avg('rating_health'),
  };
}

function buildDailyChart(history) {
  const counts = {};
  history.forEach(({ date }) => {
    counts[date] = (counts[date] ?? 0) + 1;
  });
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const [y, m, d] = todayStr.split('-').map(Number);
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(y, m - 1, d - i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    days.push([key, counts[key] ?? 0]);
  }
  return days;
}


export default function FoodPage() {
  const { food, history, ratings, todayAppearances, user, userRating } = useLoaderData();
  const navigate = useNavigate();
  const breakdown = buildBreakdown(ratings);
  const chart = buildDailyChart(history);
  const maxCount = Math.max(...chart.map(([, c]) => c), 1);

  return (
    <div className="space-y-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ← Back
      </button>

      <div className="flex gap-4 items-start">
        <ImageWithFallback
          src={food.image_url}
          alt={food.name}
          className="w-28 h-28 rounded-xl shrink-0"
          iconSize="text-4xl"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{food.name}</h1>
          <RatingStars rating={food.avg_rating} count={food.rating_count} size="lg" />
          <AllergenIcons allergens={food.allergens} />
        </div>
      </div>

      {breakdown && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Community Ratings</h2>
          <Card className="p-4 max-w-sm">
            <BreakdownRow label="Overall" value={breakdown.overall} />
            <BreakdownRow label="Taste"   value={breakdown.taste} />
            <BreakdownRow label="Health"  value={breakdown.health} />
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {userRating ? 'Your Rating' : 'Rate This Food'}
        </h2>
        {user ? (
          <Card className="p-4 max-w-sm">
            <RatingForm key={userRating?.id ?? 'none'} userRating={userRating} foodId={food.id} />
          </Card>
        ) : (
          <p className="text-sm text-gray-400">
            <button
              onClick={() => document.querySelector('[data-sign-in]')?.click()}
              className="underline text-primary"
            >
              Sign in
            </button>{' '}
            to rate this food.
          </p>
        )}
      </section>

      {todayAppearances.length > 0 && (() => {
        const MEAL_PERIODS = ['Breakfast', 'Lunch', 'Dinner'];
        const hallOrder = DINING_HALLS.map(h => h.slug);
        const grouped = {};
        for (const row of todayAppearances) {
          const mp = row.meal_period;
          if (!grouped[mp]) grouped[mp] = [];
          grouped[mp].push(row);
        }
        for (const mp of Object.keys(grouped)) {
          grouped[mp].sort((a, b) =>
            hallOrder.indexOf(a.dining_halls?.slug) - hallOrder.indexOf(b.dining_halls?.slug)
          );
        }
        const activePeriods = MEAL_PERIODS.filter(mp => grouped[mp]);
        return (
          <section>
            <h2 className="text-lg font-semibold mb-2">Today's Appearances</h2>
            <Card className="p-4 max-w-sm">
              {activePeriods.map((mp, idx) => (
                <div
                  key={mp}
                  className={`flex items-start gap-4 py-2 ${idx === 0 ? 'pt-0' : ''} ${idx === activePeriods.length - 1 ? 'pb-0' : 'border-b border-gray-100'}`}
                >
                  <span className="text-sm text-gray-500 w-20 shrink-0 pt-0.5">{mp}</span>
                  <div className="flex flex-col gap-0.5">
                    {grouped[mp].map((row, i) => (
                      <span key={i} className="text-sm font-medium">{row.dining_halls?.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </section>
        );
      })()}

      <section>
        <h2 className="text-lg font-semibold mb-3">Times Served (last 30 days)</h2>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No menu history available.</p>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-stretch gap-px" style={{ height: 96 }}>
              {chart.map(([date, count]) => (
                <div key={date} className="flex flex-col justify-end items-center flex-1 min-w-0">
                  {count > 0 && (
                    <span className="text-xs text-gray-500 leading-none mb-1">{count}</span>
                  )}
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max((count / maxCount) * 80, 2)}px`,
                      backgroundColor: count > 0 ? 'var(--color-primary, #E21833)' : '#e5e7eb',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-px mt-1">
              {chart.map(([date]) => (
                <div key={date} className="flex-1 min-w-0 flex justify-center">
                  <span
                    className="text-xs text-gray-400"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {formatDateLabel(date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
