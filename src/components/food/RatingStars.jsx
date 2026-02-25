export default function RatingStars({ rating = 0, count, size = 'sm' }) {
  const filled = Math.round(rating);
  const textSize = size === 'lg' ? 'text-2xl' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? 'text-[#FFD200]' : 'text-gray-300'}>
          ★
        </span>
      ))}
      {count != null && (
        <span className="text-gray-500 text-xs ml-1">({count})</span>
      )}
    </span>
  );
}
