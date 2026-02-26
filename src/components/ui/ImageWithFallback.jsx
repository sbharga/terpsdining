export default function ImageWithFallback({ src, alt, className = '', iconSize = 'text-3xl' }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`bg-gray-100 flex items-center justify-center ${iconSize} ${className}`}>
      🍽️
    </div>
  );
}
