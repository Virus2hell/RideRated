import { MapContainer, TileLayer } from 'react-leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_TILES } from '../../lib/constants';

// Map tiles come from MAP_TILES (OpenStreetMap by default). Children are markers etc.
export default function BaseMap({ center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, className = 'h-96', children, ...props }) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className={`${className} w-full rounded-2xl`} {...props}>
      <TileLayer
        url={MAP_TILES.url}
        attribution={MAP_TILES.attribution}
        maxZoom={19}
        className={MAP_TILES.darken ? 'map-tiles-dark' : ''}
      />
      {children}
    </MapContainer>
  );
}
