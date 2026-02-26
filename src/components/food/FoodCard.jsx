import { Link } from 'react-router';
import RatingStars from './RatingStars';
import AllergenIcons from './AllergenIcons';
import ImageWithFallback from '../ui/ImageWithFallback';

export default function FoodCard({ food }) {
  return (
    <Link
      to={`/food/${food.id}`}
      className="block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <ImageWithFallback src={food.image_url} alt={food.name} className="w-full h-36" />

      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{food.name}</h3>
        <RatingStars rating={food.avg_rating} count={food.rating_count} />
        <AllergenIcons allergens={food.allergens} compact />
      </div>
    </Link>
  );
}
