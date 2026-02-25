export const ALLERGEN_LABELS = {
  milk:        { label: 'Dairy',     emoji: '🥛' },
  eggs:        { label: 'Eggs',      emoji: '🥚' },
  fish:        { label: 'Fish',      emoji: '🐟' },
  shellfish:   { label: 'Shellfish', emoji: '🦐' },
  'tree nuts': { label: 'Tree Nuts', emoji: '🌰' },
  peanuts:     { label: 'Peanuts',   emoji: '🥜' },
  wheat:       { label: 'Wheat',     emoji: '🌾' },
  soybeans:    { label: 'Soy',       emoji: '🫘' },
  sesame:      { label: 'Sesame',    emoji: '🌱' },
};

/**
 * Renders a row of allergen badges for a given allergens string array.
 * Pass `compact` to show emoji-only badges (for use inside FoodCard).
 */
export default function AllergenIcons({ allergens = [], compact = false }) {
  if (!allergens?.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {allergens.map((key) => {
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
