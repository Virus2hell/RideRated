import { Link } from 'react-router-dom';
import RatingBadge from './ui/RatingBadge';
import { PinIcon } from './ui/Icons';

export default function RoadCard({ road, onHover, active }) {
  return (
    <Link
      to={`/roads/${road.id}`}
      onMouseEnter={() => onHover?.(road)}
      className={`card flex items-center gap-4 p-4 transition hover:border-brand-600/60 ${active ? 'border-brand-600/60 bg-zinc-900' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-2xl leading-none tracking-wide">{road.name}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
          <PinIcon className="size-3" /> {road.city ?? 'Unknown'}
          {road.distance_km != null && <span>· {road.distance_km} km away</span>}
        </p>
      </div>
      <div className="text-right">
        <RatingBadge value={road.avg_rating} />
        <p className="mt-1 text-xs text-zinc-500">{road.review_count} review{road.review_count === 1 ? '' : 's'}</p>
      </div>
    </Link>
  );
}
