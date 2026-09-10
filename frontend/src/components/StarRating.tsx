// frontend/src/components/StarRating.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Current rating value (0 = unrated) */
  value: number;
  /** Interactive mode (user can click to rate) */
  interactive?: boolean;
  /** Size of stars in pixels */
  size?: number;
  /** Show the numeric value next to stars */
  showValue?: boolean;
  /** Callback when rating changes (interactive mode) */
  onChange?: (rating: number) => void;
}

export function StarRating({
  value,
  interactive = false,
  size = 20,
  showValue = false,
  onChange,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const displayValue = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(null)}
          className={`
            ${interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
            ${!interactive && 'pointer-events-none'}
          `}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={`
              ${
                star <= displayValue
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              }
            `}
          />
        </button>
      ))}

      {showValue && value > 0 && (
        <span className="ms-2 text-sm font-semibold text-amber-600">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Average rating display with count.
 */
export function RatingDisplay({
  average,
  count,
  size = 16,
}: {
  average: number | null;
  count: number;
  size?: number;
}) {
  if (average === null || count === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Star size={size} className="fill-gray-200 text-gray-200" />
        <span>No ratings yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(average)} size={size} />
      <span className="text-xs font-medium text-amber-600">
        {average.toFixed(1)}
      </span>
      <span className="text-xs text-gray-400">
        ({count} {count === 1 ? 'rating' : 'ratings'})
      </span>
    </div>
  );
}