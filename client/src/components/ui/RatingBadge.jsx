import { ratingColor } from '../../lib/format';
import { StarIcon } from './Icons';

// Compact coloured pill: green for great roads, red for bad ones.
export default function RatingBadge({ value, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-bold text-zinc-950 ${className}`}
      style={{ backgroundColor: ratingColor(value) }}
    >
      <StarIcon className="size-3.5" />
      {value != null ? value.toFixed(1) : '–'}
    </span>
  );
}
