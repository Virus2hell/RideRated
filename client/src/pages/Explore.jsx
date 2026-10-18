import { useState } from 'react';
import { useRoads } from '../lib/queries';
import RoadsMap from '../components/map/RoadsMap';
import RoadCard from '../components/RoadCard';
import { CrosshairIcon } from '../components/ui/Icons';

const SORTS = [
  { value: 'popular', label: 'Most reviewed' },
  { value: 'top', label: 'Top rated' },
  { value: 'worst', label: 'Worst rated' },
];

export default function Explore() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('popular');
  const [near, setNear] = useState(null); // { lat, lng } when "Near me" is on
  const [focus, setFocus] = useState(null);
  const [geoError, setGeoError] = useState('');

  const params = near ? { lat: near.lat, lng: near.lng, radiusKm: 100, sort: 'nearest', q } : { sort, q };
  const { data: roads = [], isFetching } = useRoads(params);

  const toggleNearMe = () => {
    if (near) return setNear(null);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNear(loc);
        setFocus(loc);
      },
      () => setGeoError('Location permission denied.'),
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-6xl leading-none tracking-wide">Explore roads</h1>
      <p className="mt-1 text-zinc-400">Green pins are rider favourites. Red pins mean ride with caution.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search roads or cities: Tamhini, Lonavala…"
          className="input max-w-sm"
        />
        {!near && (
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}
        <button onClick={toggleNearMe} className={near ? 'btn-primary' : 'btn-ghost'}>
          <CrosshairIcon /> {near ? 'Near me (100 km)' : 'Near me'}
        </button>
        {isFetching && <span className="text-sm text-zinc-500">Updating…</span>}
        {geoError && <span className="text-sm text-red-400">{geoError}</span>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <RoadsMap roads={roads} focus={focus} className="h-[60vh] min-h-96 lg:h-[70vh]" />
        <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
          {roads.length === 0 && <p className="card p-6 text-center text-zinc-400">No roads found.</p>}
          {roads.map((road) => (
            <RoadCard key={road.id} road={road} onHover={setFocus} active={focus?.id === road.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
