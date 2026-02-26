import { supabase } from './supabase';
import { throwOnError } from './db';
import { todayISO } from '../utils/date';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export { todayISO, getCurrentMealPeriod } from '../utils/date';

// ---------------------------------------------------------------------------
// Hours
// ---------------------------------------------------------------------------

export async function getTodayHours() {
  return throwOnError(
    await supabase.from('hours').select('*, dining_halls(id, name, slug)').eq('date', todayISO())
  ) ?? [];
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

export async function getMenusByPeriod(date, mealPeriod) {
  return throwOnError(
    await supabase
      .from('menus')
      .select('dining_hall_id, dining_halls(id, name, slug), foods(id, name, allergens, avg_rating, rating_count, image_url)')
      .eq('date', date)
      .eq('meal_period', mealPeriod)
  ) ?? [];
}

/**
 * Groups a flat menus array (from getMenusByPeriod) by dining-hall slug.
 * Returns: { [slug]: { hall: {...}, foods: [...] } }
 */
export function groupMenusByHall(menus) {
  return menus.reduce((acc, row) => {
    const slug = row.dining_halls?.slug;
    if (!slug) return acc;
    if (!acc[slug]) acc[slug] = { hall: row.dining_halls, foods: [] };
    if (row.foods) acc[slug].foods.push(row.foods);
    return acc;
  }, {});
}

/** Returns a Set of food IDs that appear in any of today's menus. */
export async function getTodayFoodIds() {
  const data = throwOnError(
    await supabase.from('menus').select('food_id').eq('date', todayISO())
  );
  return new Set((data ?? []).map((r) => r.food_id));
}

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------

export async function getFoodById(id) {
  return throwOnError(
    await supabase.from('foods').select('*').eq('id', id).single()
  );
}

export async function getFoodMenuHistory(foodId) {
  const cutoff = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })
    .format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  return throwOnError(
    await supabase
      .from('menus')
      .select('date, meal_period, dining_halls(name, slug)')
      .eq('food_id', foodId)
      .gte('date', cutoff)
      .order('date', { ascending: false })
  ) ?? [];
}

export async function getFoodRatings(foodId) {
  return throwOnError(
    await supabase
      .from('ratings')
      .select('rating_overall, rating_taste, rating_health, created_at')
      .eq('food_id', foodId)
      .order('created_at', { ascending: false })
  ) ?? [];
}

export async function getAllFoods() {
  return throwOnError(
    await supabase.from('foods').select('id, name, allergens, avg_rating, rating_count, image_url').order('name')
  ) ?? [];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search foods by name and optionally exclude specific allergens.
 * Allergen exclusion and dietary filtering are pushed to the server via PostgREST
 * array operators (cs / not.cs) so only matching rows are transferred.
 * sort: 'rating' | 'trending' | 'recent'
 */
export async function searchFoods(query = '', excludeAllergens = [], dietFilters = [], sort = 'rating') {
  const orderCol = sort === 'recent' ? 'created_at' : 'avg_rating';
  let req = supabase
    .from('foods')
    .select('id, name, allergens, avg_rating, rating_count, image_url, created_at')
    .order(orderCol, { ascending: false })
    .limit(200);

  if (query) req = req.ilike('name', `%${query}%`);

  // Server-side: foods must contain every dietary marker
  if (dietFilters.length > 0) req = req.contains('allergens', dietFilters);

  // Server-side: foods must not contain any excluded allergen
  for (const a of excludeAllergens) req = req.not('allergens', 'cs', `{${a}}`);

  let foods = throwOnError(await req) ?? [];

  if (sort === 'trending' && foods.length > 0) {
    const ids = foods.map((f) => f.id);
    // Fetch a bounded window of recent rating events; one food_id per row is all we need.
    const { data: recentRatings } = await supabase
      .from('ratings')
      .select('food_id')
      .in('food_id', ids)
      .order('created_at', { ascending: false })
      .limit(500);

    const seen = new Set();
    const orderedIds = [];
    for (const r of recentRatings ?? []) {
      if (!seen.has(r.food_id)) { seen.add(r.food_id); orderedIds.push(r.food_id); }
    }
    const ratedSet = new Set(orderedIds);
    const unrated = foods.filter((f) => !ratedSet.has(f.id));
    const ratedMap = Object.fromEntries(foods.map((f) => [f.id, f]));
    foods = [...orderedIds.map((id) => ratedMap[id]).filter(Boolean), ...unrated];
  }

  return foods;
}

/** Returns a Set of food IDs served at a specific dining hall today. */
export async function getTodayFoodIdsByHall(hallSlug) {
  const data = throwOnError(
    await supabase
      .from('menus')
      .select('food_id, dining_halls!inner(slug)')
      .eq('date', todayISO())
      .eq('dining_halls.slug', hallSlug)
  );
  return new Set((data ?? []).map((r) => r.food_id));
}

// ---------------------------------------------------------------------------
// Profile / Ratings
// ---------------------------------------------------------------------------

export async function getUserRatings(userId) {
  return throwOnError(
    await supabase
      .from('ratings')
      .select('*, foods(id, name, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  ) ?? [];
}

export async function deleteRating(ratingId) {
  throwOnError(await supabase.from('ratings').delete().eq('id', ratingId));
}

export async function upsertRating(userId, foodId, { ratingOverall, ratingTaste, ratingHealth }) {
  throwOnError(
    await supabase.from('ratings').upsert(
      {
        user_id: userId,
        food_id: foodId,
        rating_overall: ratingOverall,
        rating_taste: ratingTaste,
        rating_health: ratingHealth,
      },
      { on_conflict: 'user_id,food_id' }
    )
  );
}

export async function getUserRatingForFood(userId, foodId) {
  return throwOnError(
    await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('food_id', foodId)
      .maybeSingle()
  ); // null if not yet rated
}
