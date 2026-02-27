import { supabase } from './supabase';
import { throwOnError } from './db';
import { todayISO } from '../utils/date';


export { todayISO, getCurrentMealPeriod } from '../utils/date';


export async function getTodayHours() {
  return throwOnError(
    await supabase.from('hours').select('*, dining_halls(id, name, slug)').eq('date', todayISO())
  ) ?? [];
}


export async function getMenusByPeriod(date, mealPeriod) {
  return throwOnError(
    await supabase
      .from('menus')
      .select('dining_hall_id, dining_halls(id, name, slug), foods(id, name, allergens, avg_rating, rating_count, image_url)')
      .eq('date', date)
      .eq('meal_period', mealPeriod)
  ) ?? [];
}

export function groupMenusByHall(menus) {
  return menus.reduce((acc, row) => {
    const slug = row.dining_halls?.slug;
    if (!slug) return acc;
    if (!acc[slug]) acc[slug] = { hall: row.dining_halls, foods: [] };
    if (row.foods) acc[slug].foods.push(row.foods);
    return acc;
  }, {});
}

export async function getTodayFoodIds() {
  const data = throwOnError(
    await supabase.from('menus').select('food_id').eq('date', todayISO())
  );
  return new Set((data ?? []).map((r) => r.food_id));
}


export async function getFoodById(id) {
  return throwOnError(
    await supabase.from('foods').select('*').eq('id', id).single()
  );
}

export async function getTodayAppearancesForFood(foodId) {
  return throwOnError(
    await supabase
      .from('menus')
      .select('meal_period, dining_halls(name, slug)')
      .eq('food_id', foodId)
      .eq('date', todayISO())
      .order('meal_period', { ascending: true })
  ) ?? [];
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


export async function searchFoods(query = '', excludeAllergens = [], dietFilters = [], sort = 'rating') {
  const orderCol = sort === 'recent' ? 'created_at' : 'avg_rating';
  let req = supabase
    .from('foods')
    .select('id, name, allergens, avg_rating, rating_count, image_url, created_at')
    .order(orderCol, { ascending: false })
    .limit(200);

  if (query) req = req.ilike('name', `%${query}%`);

  if (dietFilters.length > 0) req = req.contains('allergens', dietFilters);

  for (const a of excludeAllergens) req = req.not('allergens', 'cs', `{${a}}`);

  let foods = throwOnError(await req) ?? [];

  if (sort === 'trending' && foods.length > 0) {
    const ids = foods.map((f) => f.id);
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
  );
}
