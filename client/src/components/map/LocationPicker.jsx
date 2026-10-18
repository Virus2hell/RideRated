import { useEffect } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import BaseMap from './BaseMap';
import { newPin, ratingPin } from './mapIcons';

function ClickHandler({ onPick }) {
  // wrap() keeps longitude within -180..180 even if the map was scrolled around the world
  useMapEvents({ click: (e) => onPick(e.latlng.wrap(), 'click') });
  return null;
}

// Flies to the pin when it's set from outside the map (PIN code or road search).
// flyKey changes each time that happens; clicking the map doesn't change it, so no jumpy panning.
function FlyToPin({ value, flyKey }) {
  const map = useMap();
  useEffect(() => {
    if (flyKey && value) map.flyTo([value.lat, value.lng], 15, { duration: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only fly when flyKey changes
  }, [flyKey, map]);
  return null;
}

// Click anywhere to drop a pin. Existing roads nearby are shown so riders don't create duplicates.
export default function LocationPicker({ value, onChange, flyKey, nearbyRoads = [], onPickRoad }) {
  return (
    <BaseMap className="h-80 cursor-crosshair" zoom={value ? 14 : undefined} center={value ? [value.lat, value.lng] : undefined}>
      <ClickHandler onPick={onChange} />
      <FlyToPin value={value} flyKey={flyKey} />
      {nearbyRoads.map((road) => (
        <Marker
          key={road.id}
          position={[road.lat, road.lng]}
          icon={ratingPin(road.avg_rating)}
          eventHandlers={{ click: () => onPickRoad?.(road) }}
        />
      ))}
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={newPin}
          draggable
          eventHandlers={{ dragend: (e) => onChange(e.target.getLatLng().wrap(), 'drag') }}
        />
      )}
    </BaseMap>
  );
}
