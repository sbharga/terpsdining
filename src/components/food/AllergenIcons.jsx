export const DIETARY_LABELS = {
  vegan:         { label: 'Vegan',         emoji: '🌱' },
  vegetarian:    { label: 'Vegetarian',    emoji: '🥗' },
  halalfriendly: { label: 'Halal-Friendly', emoji: '☪️' },
};

export const ALLERGEN_LABELS = {
  milk:        { label: 'Dairy',     emoji: '🥛' },
  eggs:        { label: 'Eggs',      emoji: '🥚' },
  fish:        { label: 'Fish',      emoji: '🐟' },
  shellfish:   { label: 'Shellfish', emoji: '🦐' },
  'tree nuts': { label: 'Tree Nuts', emoji: '🌰' },
  peanuts:     { label: 'Peanuts',   emoji: '🥜' },
  wheat:       { label: 'Wheat',     emoji: '🌾' },
  soybeans:    { label: 'Soy',       emoji: '⬛' },
  sesame:      { label: 'Sesame',    emoji: '⬛' },
};

/**
 * Renders allergen and dietary badges for a food item.
 * Dietary (vegan/vegetarian) shown in green; allergens in gray.
 * Pass `compact` to show emoji-only badges (for use inside FoodCard).
 */
export default function AllergenIcons({ allergens = [], compact = false }) {
  if (!allergens?.length) return null;

  const dietary = allergens.filter((k) => DIETARY_LABELS[k]);
  const allergenKeys = allergens.filter((k) => !DIETARY_LABELS[k]);

  return (
    <div className="flex flex-wrap gap-1">
      {dietary.map((key) => {
        const meta = DIETARY_LABELS[key];
        return (
          <span
            key={key}
            title={meta.label}
            className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
          >
            {meta.emoji}
            {!compact && <span>{meta.label}</span>}
          </span>
        );
      })}
      {allergenKeys.map((key) => {
        const meta = ALLERGEN_LABELS[key] ?? { label: key, emoji: '⚠️' };
        return (
          <span
            key={key}
            title={meta.label}
            className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {meta.emoji}
            {!compact && <span>{meta.label}</span>}
          </span>
        );
      })}
    </div>
  );
}
