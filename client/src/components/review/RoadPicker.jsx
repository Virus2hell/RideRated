import { useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useRoadSuggestions, useRoads } from '../../lib/queries';
import useDebounce from '../../lib/useDebounce';
import LocationPicker from '../map/LocationPicker';
import FormField from '../ui/FormField';
import RatingBadge from '../ui/RatingBadge';
import Spinner from '../ui/Spinner';
import { PinIcon } from '../ui/Icons';

// Step 1 of "Rate a road": pick a road that's already on RideRated, pick any road in India from
// OpenStreetMap search, or type a PIN code / click the map to add one yourself.
export default function RoadPicker({ selected, onSelect, newRoad, setNewRoad, errors }) {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim());
  const [flyKey, setFlyKey] = useState(0);
  const [pinState, setPinState] = useState({ loading: false, error: '', place: null });

  const { data: ours = [] } = useRoads({ q, limit: 5 }, { enabled: q.length >= 2 });
  const { data: osm, isFetching: osmLoading } = useRoadSuggestions(q);
  // OSM roads that are already on RideRated are shown in the first group instead.
  const osmRoads = (osm?.roads ?? []).filter((r) => !r.roadId || !ours.some((o) => o.id === r.roadId));

  const pin = newRoad.lat != null ? { lat: newRoad.lat, lng: newRoad.lng } : null;
  // Roads within 3 km of the pin: "did you mean one of these?"
  const { data: nearby = [] } = useRoads(
    { lat: pin?.lat, lng: pin?.lng, radiusKm: 3, sort: 'nearest', limit: 5 },
    { enabled: !!pin },
  );

  const pickOsmRoad = (r) => {
    setSearch('');
    if (r.roadId) return onSelect({ id: r.roadId, name: r.name, city: r.city, avg_rating: r.avg_rating });
    setNewRoad({ name: r.name, city: r.city ?? '', pincode: r.pincode ?? '', lat: r.lat, lng: r.lng, osmId: r.osmId });
    setPinState({ loading: false, error: '', place: null });
    setFlyKey((k) => k + 1);
  };

  const lookupPin = async (value) => {
    setNewRoad((r) => ({ ...r, pincode: value }));
    if (!/^[1-9]\d{5}$/.test(value)) return setPinState({ loading: false, error: '', place: null });
    setPinState({ loading: true, error: '', place: null });
    try {
      const { place } = (await api.get(`/geo/pincode/${value}`)).data;
      setNewRoad((r) => ({ ...r, pincode: value, city: place.city ?? '', lat: place.lat, lng: place.lng, osmId: undefined }));
      setPinState({ loading: false, error: '', place });
      setFlyKey((k) => k + 1);
    } catch (err) {
      setPinState({ loading: false, error: errorMessage(err), place: null });
    }
  };

  if (selected) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-brand-600/50 bg-brand-600/10 p-4">
        <PinIcon className="size-6 text-brand-500" />
        <div className="flex-1">
          <p className="font-display text-2xl leading-none tracking-wide">{selected.name}</p>
          <p className="text-sm text-zinc-400">{selected.city}</p>
        </div>
        <RatingBadge value={selected.avg_rating} />
        <button type="button" onClick={() => onSelect(null)} className="text-sm text-zinc-400 hover:text-white">Change</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Search */}
      <div>
        <FormField
          label="Search any road in India"
          placeholder="e.g. FC Road, Linking Road, Tamhini Ghat, NH 48…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          hint="Local streets, highways and ghats from OpenStreetMap. Roads around Maharashtra show first."
        />
        {q.length >= 2 && (
          <div className="mt-2 overflow-hidden rounded-lg border border-zinc-800">
            {ours.length > 0 && (
              <>
                <p className="bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-400">Already on RideRated</p>
                {ours.map((r) => (
                  <button key={r.id} type="button" onClick={() => { setSearch(''); onSelect(r); }}
                    className="flex w-full items-center justify-between border-t border-zinc-800 p-3 text-left hover:bg-zinc-800">
                    <span>{r.name} <span className="text-sm text-zinc-500">· {r.city}</span></span>
                    <RatingBadge value={r.avg_rating} />
                  </button>
                ))}
              </>
            )}
            <p className="bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Roads in India</p>
            {osmLoading && !osm ? (
              <div className="border-t border-zinc-800"><Spinner label="Searching roads…" /></div>
            ) : osm?.unavailable ? (
              <p className="border-t border-zinc-800 p-3 text-sm text-zinc-500">Road search is unavailable right now. Use the PIN code or the map below.</p>
            ) : osmRoads.length === 0 ? (
              <p className="border-t border-zinc-800 p-3 text-sm text-zinc-500">No roads found. Try another spelling, or add it with the PIN code / map below.</p>
            ) : (
              osmRoads.map((r) => (
                <button key={`${r.osmId}-${r.name}-${r.lat}`} type="button" onClick={() => pickOsmRoad(r)}
                  className="flex w-full items-center gap-3 border-t border-zinc-800 p-3 text-left hover:bg-zinc-800">
                  <PinIcon className="size-4 shrink-0 text-zinc-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{r.name}</span>
                    <span className="block truncate text-xs text-zinc-500">{r.area}{r.pincode && ` · ${r.pincode}`}</span>
                  </span>
                  {r.roadId ? <RatingBadge value={r.avg_rating} /> : <span className="text-xs text-zinc-600">New</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-500">
        <span className="h-px flex-1 bg-zinc-800" /> or find it by PIN code <span className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* 2. PIN code → map jumps there */}
      <div className="max-w-xs">
        <FormField
          label="PIN code"
          inputMode="numeric"
          maxLength={6}
          placeholder="e.g. 411038"
          value={newRoad.pincode}
          onChange={(e) => lookupPin(e.target.value.replace(/\D/g, ''))}
          error={pinState.error}
          hint={
            pinState.loading ? 'Finding location…'
              : pinState.place ? `📍 ${[pinState.place.city, pinState.place.state].filter(Boolean).join(', ')}. Now drag the pin onto the exact road.`
                : 'The map jumps to that area.'
          }
        />
      </div>

      {/* 3. Map */}
      <div>
        <p className="mb-2 text-sm text-zinc-400">Click the map where the road is. Drag the pin to fine-tune.</p>
        <LocationPicker
          value={pin}
          flyKey={flyKey}
          onChange={({ lat, lng }, how) =>
            // a click somewhere else may be a different road, so forget the OSM id; a drag is just fine-tuning
            setNewRoad((r) => ({ ...r, lat, lng, ...(how === 'click' ? { osmId: undefined } : {}) }))
          }
          nearbyRoads={nearby}
          onPickRoad={onSelect}
        />
        {errors.road && !pin && <p className="mt-2 text-sm text-red-400">{errors.road[0]}</p>}
      </div>

      {pin && nearby.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-300">Already on RideRated nearby. Is it one of these?</p>
          <div className="flex flex-wrap gap-2">
            {nearby.map((r) => (
              <button key={r.id} type="button" onClick={() => onSelect(r)} className="btn-ghost py-1">
                {r.name} <span className="text-zinc-500">{r.distance_km} km</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pin && (
        <div>
          {errors.road && <p className="mb-2 text-sm text-red-400">{errors.road[0]}</p>}
          <FormField
            label="Road name"
            placeholder="e.g. Dive Ghat"
            value={newRoad.name}
            onChange={(e) => setNewRoad((r) => ({ ...r, name: e.target.value }))}
            hint={newRoad.city ? `Area: ${newRoad.city}${newRoad.pincode ? ` · ${newRoad.pincode}` : ''}` : undefined}
            required
          />
        </div>
      )}
    </div>
  );
}
