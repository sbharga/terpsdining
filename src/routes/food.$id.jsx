import { useState } from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import { supabase } from '../api/supabase';
import {
  getFoodById,
  getFoodMenuHistory,
  getFoodRatings,
  getUserRatingForFood,
  upsertRating,
} from '../api/queries';
import RatingStars from '../components/food/RatingStars';
import AllergenIcons from '../components/food/AllergenIcons';

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loader({ params }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [food, history, ratings, userRating] = await Promise.all([
    getFoodById(params.id),
    getFoodMenuHistory(params.id),
    getFoodRatings(params.id),
    user ? getUserRatingForFood(user.id, params.id) : Promise.resolve(null),
  ]);

  return { food, history, ratings, user, userRating };
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Clickable star row for a single rating category. */
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
              n <= value ? 'text-[#FFD200]' : 'text-gray-300 hover:text-[#FFD200]/60'
            }`}
          >
            ★
          </span>
        </label>
      ))}
    </div>
  );
}

/** useFetcher-based rating form — submits without full navigation. */
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-lg bg-[#E21833] text-white px-4 py-2 text-sm font-medium hover:bg-[#c01028] disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Saving…' : hasRating ? 'Update Rating' : 'Submit Rating'}
      </button>
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function buildWeeklyChart(history) {
  const counts = {};
  history.forEach(({ date }) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // snap to Monday
    const key = d.toISOString().split('T')[0];
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FoodPage() {
  const { food, history, ratings, user, userRating } = useLoaderData();
  const breakdown = buildBreakdown(ratings);
  const chart = buildWeeklyChart(history);
  const maxCount = Math.max(...chart.map(([, c]) => c), 1);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex gap-4 items-start">
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-28 h-28 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-28 h-28 rounded-xl bg-gray-100 flex items-center justify-center text-4xl shrink-0">
            🍽️
          </div>
        )}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{food.name}</h1>
          <RatingStars rating={food.avg_rating} count={food.rating_count} size="lg" />
          <AllergenIcons allergens={food.allergens} />
        </div>
      </div>

      {/* Community rating breakdown */}
      {breakdown && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Community Ratings</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-xs">
            <BreakdownRow label="Overall" value={breakdown.overall} />
            <BreakdownRow label="Taste"   value={breakdown.taste} />
            <BreakdownRow label="Health"  value={breakdown.health} />
          </div>
        </section>
      )}

      {/* Rate this food */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          {userRating ? 'Your Rating' : 'Rate This Food'}
        </h2>
        {user ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-sm">
            <RatingForm key={userRating?.id ?? 'none'} userRating={userRating} foodId={food.id} />
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            <button
              onClick={() => document.querySelector('[data-sign-in]')?.click()}
              className="underline text-[#E21833]"
            >
              Sign in
            </button>{' '}
            to rate this food.
          </p>
        )}
      </section>

      {/* Times served chart */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Times Served (last 30 days)</h2>
        {chart.length === 0 ? (
          <p className="text-gray-400 text-sm">No menu history in the last 30 days.</p>
        ) : (
          <div className="flex items-end gap-3 h-24">
            {chart.map(([week, count]) => (
              <div key={week} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs text-gray-500">{count}</span>
                <div
                  className="w-full rounded-t bg-[#E21833]"
                  style={{ height: `${(count / maxCount) * 72}px` }}
                />
                <span className="text-xs text-gray-400">{week.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent appearances */}
      {history.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Recent Appearances</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {history.slice(0, 10).map((row, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400 w-24">
                  {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span>{row.meal_period}</span>
                <span className="text-gray-400">@ {row.dining_halls?.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
