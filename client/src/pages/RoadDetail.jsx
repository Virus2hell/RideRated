import { Link, useParams } from 'react-router-dom';
import { Marker } from 'react-leaflet';
import { useRoad } from '../lib/queries';
import { formatDate, ratingColor } from '../lib/format';
import { RATING_CATEGORIES } from '../lib/constants';
import BaseMap from '../components/map/BaseMap';
import { ratingPin } from '../components/map/mapIcons';
import ReviewList from '../components/review/ReviewList';
import StarRating from '../components/ui/StarRating';
import TagChip from '../components/ui/TagChip';
import Spinner from '../components/ui/Spinner';
import { CalendarIcon, PinIcon, PlusIcon } from '../components/ui/Icons';
import NotFound from './NotFound';

function RatingBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-semibold">{value ?? '–'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${((value ?? 0) / 5) * 100}%`, backgroundColor: ratingColor(value) }} />
      </div>
    </div>
  );
}

export default function RoadDetail() {
  const { id } = useParams();
  const { data: road, isLoading, isError } = useRoad(id);

  if (isLoading) return <Spinner />;
  if (isError || !road) return <NotFound />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="flex items-center gap-1 text-sm text-zinc-400">
            <PinIcon /> {road.city ?? 'Maharashtra'}{road.pincode && ` · ${road.pincode}`}
          </p>
          <h1 className="mt-1 font-display text-6xl leading-none tracking-wide sm:text-7xl">{road.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="font-display text-6xl leading-none" style={{ color: ratingColor(road.avg_rating) }}>
              {road.avg_rating?.toFixed(1) ?? '–'}
            </span>
            <div>
              <StarRating value={road.avg_rating ?? 0} size="size-5" />
              <p className="mt-1 text-sm text-zinc-400">
                {road.review_count} rider review{road.review_count === 1 ? '' : 's'}
              </p>
            </div>
            <Link to={`/reviews/new?roadId=${road.id}`} className="btn-primary ml-auto">
              <PlusIcon /> Review this road
            </Link>
          </div>

          {road.top_tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {road.top_tags.map((t) => <TagChip key={t.label} tag={t} />)}
            </div>
          )}

          <div className="road-divider my-8 opacity-40" />

          <h2 className="mb-4 font-display text-4xl tracking-wide">Rider reviews</h2>
          <ReviewList filters={{ roadId: road.id }} showRoad={false} columns="sm:grid-cols-2" />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <BaseMap center={[road.lat, road.lng]} zoom={11} className="h-64">
            <Marker position={[road.lat, road.lng]} icon={ratingPin(road.avg_rating)} />
          </BaseMap>
          <div className="card space-y-4 p-5">
            <h3 className="font-display text-2xl tracking-wide">Rating breakdown</h3>
            {RATING_CATEGORIES.map((c) => <RatingBar key={c.key} label={c.label} value={road[`avg_${c.key}`]} />)}
            {road.last_ridden_on && (
              <p className="flex items-center gap-1.5 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
                <CalendarIcon /> Last ridden {formatDate(road.last_ridden_on)}
              </p>
            )}
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${road.lat},${road.lng}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full"
          >
            Get directions
          </a>
        </aside>
      </div>
    </div>
  );
}
