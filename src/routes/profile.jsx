import { useState } from 'react';
import { useLoaderData, Link, useFetcher } from 'react-router';
import { redirect } from 'react-router';
import { supabase } from '../api/supabase';
import { getUserRatings, deleteRating } from '../api/queries';
import RatingStars from '../components/food/RatingStars';
import { Card } from '../components/ui/Card';
import ImageWithFallback from '../components/ui/ImageWithFallback';

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw redirect('/');

  const ratings = await getUserRatings(user.id);
  return { user, ratings };
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function action({ request }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response('Unauthorized', { status: 401 });

  const formData = await request.formData();
  await deleteRating(formData.get('ratingId'));
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single rating row with optimistic delete. */
function RatingItem({ r }) {
  const fetcher = useFetcher();

  // Optimistically hide the row while the delete is in flight
  if (fetcher.state !== 'idle') return null;

  return (
    <li><Card className="flex items-center gap-4 p-3">
      <ImageWithFallback
        src={r.foods?.image_url}
        alt={r.foods?.name ?? ''}
        className="w-14 h-14 rounded-lg shrink-0"
        iconSize="text-2xl"
      />

      <div className="flex-1 min-w-0">
        <Link
          to={`/food/${r.foods?.id}`}
          className="font-medium text-sm hover:underline line-clamp-1"
        >
          {r.foods?.name ?? 'Unknown food'}
        </Link>
        <RatingStars rating={r.rating_overall} />
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(r.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Delete button */}
      <fetcher.Form method="post">
        <input type="hidden" name="ratingId" value={r.id} />
        <button
          type="submit"
          className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
          aria-label="Remove rating"
        >
          Remove
        </button>
      </fetcher.Form>
    </Card></li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const { user, ratings } = useLoaderData();
  const [sortBy, setSortBy] = useState('newest');
  const sorted = [...ratings].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'highest') return (b.rating_overall ?? 0) - (a.rating_overall ?? 0);
    if (sortBy === 'lowest')  return (a.rating_overall ?? 0) - (b.rating_overall ?? 0);
    return 0;
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Your Ratings
          {ratings.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({ratings.length})
            </span>
          )}
        </h2>

        {ratings.length === 0 ? (
          <p className="text-gray-400 text-sm">
            You haven&apos;t rated anything yet.{' '}
            <Link to="/search" className="underline text-primary">
              Find a food to rate.
            </Link>
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { key: 'newest',  label: 'Newest' },
                { key: 'oldest',  label: 'Oldest' },
                { key: 'highest', label: 'Highest Rated' },
                { key: 'lowest',  label: 'Lowest Rated' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                    sortBy === key
                      ? 'bg-primary text-white border-primary'
                      : 'text-gray-400 border-gray-200 bg-white hover:border-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="space-y-3">
              {sorted.map((r) => (
                <RatingItem key={r.id} r={r} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
