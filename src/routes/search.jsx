import { useRef } from 'react';
import { useLoaderData, Form, useNavigation } from 'react-router';
import { searchFoods, getTodayFoodIds } from '../api/queries';
import FoodCard from '../components/food/FoodCard';
import { ALLERGEN_LABELS, DIETARY_LABELS } from '../components/food/AllergenIcons';

const ALL_ALLERGENS = Object.keys(ALLERGEN_LABELS);
const ALL_DIETARY   = Object.keys(DIETARY_LABELS);

export async function loader({ request }) {
  const url              = new URL(request.url);
  const query            = url.searchParams.get('q') ?? '';
  const excludeAllergens = url.searchParams.getAll('exclude');
  const dietFilters      = url.searchParams.getAll('diet');
  const availableToday   = url.searchParams.get('today') === '1';

  let foods = await searchFoods(query, excludeAllergens, dietFilters);
  if (availableToday) {
    const todayIds = await getTodayFoodIds();
    foods = foods.filter((f) => todayIds.has(f.id));
  }

  return { foods, query, excludeAllergens, dietFilters, availableToday };
}

export default function SearchPage() {
  const { foods, query, excludeAllergens, dietFilters, availableToday } = useLoaderData();
  const navigation  = useNavigation();
  const isSearching = navigation.state === 'loading';
  const formRef     = useRef(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search Foods</h1>

      <Form method="get" ref={formRef} className="space-y-4">
        {/* Text search bar */}
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by food name…"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E21833] focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#E21833] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c01028] active:scale-95 transition-all shadow-sm"
          >
            Search
          </button>
        </div>

        {/* Availability toggle */}
        <div className="flex items-center gap-3">
          <label key={'today' + availableToday} className="cursor-pointer select-none">
            <input
              type="checkbox"
              name="today"
              value="1"
              defaultChecked={availableToday}
              className="sr-only peer"
              onChange={() => formRef.current?.requestSubmit()}
            />
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors
                ${availableToday
                  ? 'bg-[#E21833] text-white border-[#E21833]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
            >
              📅 Available Today
            </span>
          </label>
        </div>

        {/* Dietary preferences */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Dietary Preferences
          </legend>
          <div className="flex flex-wrap gap-2">
            {ALL_DIETARY.map((d) => {
              const { label, emoji } = DIETARY_LABELS[d];
              const checked = dietFilters.includes(d);
              return (
                <label key={d + checked} className="cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="diet"
                    value={d}
                    defaultChecked={checked}
                    className="sr-only peer"
                    onChange={() => formRef.current?.requestSubmit()}
                  />
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors
                      ${checked
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    {emoji} {label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Allergen exclusion — pill chip toggles */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Exclude Allergens
          </legend>
          <div className="flex flex-wrap gap-2">
            {ALL_ALLERGENS.map((a) => {
              const { label, emoji } = ALLERGEN_LABELS[a];
              const checked = excludeAllergens.includes(a);
              return (
                <label key={a + checked} className="cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="exclude"
                    value={a}
                    defaultChecked={checked}
                    className="sr-only peer"
                    onChange={() => formRef.current?.requestSubmit()}
                  />
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors
                      ${checked
                        ? 'bg-[#E21833] text-white border-[#E21833]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    {emoji} {label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Form>

      {/* Results */}
      <div>
        {isSearching ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#E21833] animate-spin" />
            Searching…
          </div>
        ) : foods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-400 text-sm">
              {query
                ? `No results for "${query}".`
                : 'Enter a food name or select filters above.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {foods.length} result{foods.length !== 1 ? 's' : ''}
              {query && (
                <span className="font-medium text-gray-700"> for &ldquo;{query}&rdquo;</span>
              )}
              {availableToday && (
                <span className="text-gray-400"> · available today</span>
              )}
              {dietFilters.length > 0 && (
                <span className="text-gray-400">
                  {' '}· {dietFilters.join(', ')}
                </span>
              )}
              {excludeAllergens.length > 0 && (
                <span className="text-gray-400">
                  {' '}· excluding {excludeAllergens.join(', ')}
                </span>
              )}
            </p>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {foods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
