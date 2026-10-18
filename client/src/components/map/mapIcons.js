import L from 'leaflet';
import { ratingColor } from '../../lib/format';

// Map pins drawn with HTML/CSS (avoids Leaflet's default image icons, which break with bundlers).
export function ratingPin(rating) {
  const color = ratingColor(rating);
  const label = rating != null ? rating.toFixed(1) : '?';
  return L.divIcon({
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
    html: `<div style="position:relative;width:40px;height:48px">
      <svg viewBox="0 0 40 48" width="40" height="48" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))">
        <path d="M20 47C20 47 37 30 37 18A17 17 0 1 0 3 18C3 30 20 47 20 47Z" fill="${color}" stroke="#0a0a0a" stroke-width="2"/>
      </svg>
      <span style="position:absolute;top:9px;left:0;right:0;text-align:center;font:700 12px Inter,sans-serif;color:#0a0a0a">${label}</span>
    </div>`,
  });
}

export const newPin = L.divIcon({
  className: '',
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  html: `<svg viewBox="0 0 40 48" width="36" height="44" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))">
    <path d="M20 47C20 47 37 30 37 18A17 17 0 1 0 3 18C3 30 20 47 20 47Z" fill="#f97316" stroke="#fff" stroke-width="2.5"/>
    <circle cx="20" cy="18" r="6" fill="#fff"/></svg>`,
});
