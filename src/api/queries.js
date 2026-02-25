import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Returns 'Breakfast', 'Lunch', or 'Dinner' based on local wall-clock time. */
export function getCurrentMealPeriod() {
  const hour = new Date().getHours();
  if (hour < 10) return 'Breakfast';
  if (hour < 15) return 'Lunch';
  return 'Dinner';
}

// ---------------------------------------------------------------------------
// Hours
// ---------------------------------------------------------------------------

export async function getTodayHours() {
  const { data, error } = await supabase
    .from('hours')
    .select('*, dining_halls(id, name, slug)')
    .eq('date', todayISO());
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

export async function getMenusByPeriod(date, mealPeriod) {
  const { data, error } = await supabase
    .from('menus')
    .select(
      'dining_hall_id, dining_halls(id, name, slug), foods(id, name, allergens, avg_rating, rating_count, image_url)'
    )
    .eq('date', date)
    .eq('meal_period', mealPeriod);
  if (error) throw error;
  return data ?? [];
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

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------

export async function getFoodById(id) {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getFoodMenuHistory(foodId) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const { data, error } = await supabase
    .from('menus')
    .select('date, meal_period, dining_halls(name, slug)')
    .eq('food_id', foodId)
    .gte('date', cutoff.toISOString().split('T')[0])
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFoodRatings(foodId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating_overall, rating_taste, rating_health, created_at')
    .eq('food_id', foodId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllFoods() {
  const { data, error } = await supabase
    .from('foods')
    .select('id, name, allergens, avg_rating, rating_count, image_url')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search foods by name and optionally exclude specific allergens.
 * Allergen filtering is done client-side since Supabase array ops are limited.
 */
export async function searchFoods(query = '', excludeAllergens = [], dietFilters = []) {
  let req = supabase
    .from('foods')
    .select('id, name, allergens, avg_rating, rating_count, image_url')
    .order('avg_rating', { ascending: false })
    .limit(50);

  if (query) req = req.ilike('name', `%${query}%`);

  const { data, error } = await req;
  if (error) throw error;

  let foods = data ?? [];
  if (excludeAllergens.length > 0)
    foods = foods.filter((f) => !excludeAllergens.some((a) => f.allergens?.includes(a)));
  if (dietFilters.length > 0)
    foods = foods.filter((f) => dietFilters.every((d) => f.allergens?.includes(d)));
  return foods;
}

// ---------------------------------------------------------------------------
// Profile / Ratings
// ---------------------------------------------------------------------------

export async function getUserRatings(userId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*, foods(id, name, image_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteRating(ratingId) {
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('id', ratingId);
  if (error) throw error;
}

export async function upsertRating(userId, foodId, { ratingOverall, ratingTaste, ratingHealth }) {
  const { error } = await supabase.from('ratings').upsert(
    {
      user_id: userId,
      food_id: foodId,
      rating_overall: ratingOverall,
      rating_taste: ratingTaste,
      rating_health: ratingHealth,
    },
    { on_conflict: 'user_id,food_id' }
  );
  if (error) throw error;
}

export async function getUserRatingForFood(userId, foodId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('food_id', foodId)
    .maybeSingle();
  if (error) throw error;
  return data; // null if not yet rated
}
