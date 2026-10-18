import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup, useMap } from 'react-leaflet';
import BaseMap from './BaseMap';
import { ratingPin } from './mapIcons';
import StarRating from '../ui/StarRating';

// Moves the map when the "focus" road changes (e.g. clicked in the list).
function FlyTo({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export default function RoadsMap({ roads = [], focus, className, center, zoom }) {
  return (
    <BaseMap className={className} center={center} zoom={zoom}>
      <FlyTo focus={focus} />
      {roads.map((road) => (
        <Marker key={road.id} position={[road.lat, road.lng]} icon={ratingPin(road.avg_rating)}>
          <Popup>
            <div className="min-w-44">
              <p className="font-display text-xl leading-tight tracking-wide">{road.name}</p>
              {road.city && <p className="text-xs text-zinc-400">{road.city}</p>}
              <div className="my-1.5 flex items-center gap-2">
                <StarRating value={road.avg_rating ?? 0} size="size-3.5" />
                <span className="text-xs text-zinc-400">
                  {road.review_count} review{road.review_count === 1 ? '' : 's'}
                </span>
              </div>
              <Link to={`/roads/${road.id}`} className="text-sm font-semibold text-brand-400!">
                View road →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </BaseMap>
  );
}
