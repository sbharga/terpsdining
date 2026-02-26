export default function RatingStars({ rating = 0, count, size = 'sm' }) {
  const textSize = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const diff = rating - i;
        if (diff >= 1) return <span key={i} className="text-accent">★</span>;
        if (diff <= 0) return <span key={i} className="text-gray-300">★</span>;
        return (
          <span key={i} className="relative inline-block text-gray-300">
            ★
            <span
              className="absolute inset-0 overflow-hidden text-accent"
              style={{ width: `${diff * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
      {count != null && (
        <span className="text-gray-500 text-xs ml-1">({count})</span>
      )}
    </span>
  );
}
