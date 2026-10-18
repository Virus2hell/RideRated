// Quick-pick suggestions for review tags. Riders can also write their own (max 20 characters)
// and choose green (good) or red (warning) for each one.
export const TAG_SUGGESTIONS = [
  { label: 'Ghat', tone: 'good' },
  { label: 'Twisties', tone: 'good' },
  { label: 'Scenic', tone: 'good' },
  { label: 'Smooth tarmac', tone: 'good' },
  { label: 'Waterfalls', tone: 'good' },
  { label: 'Food stops', tone: 'good' },
  { label: 'Potholes', tone: 'bad' },
  { label: 'Speed breakers', tone: 'bad' },
  { label: 'Heavy traffic', tone: 'bad' },
  { label: 'Construction', tone: 'bad' },
  { label: 'Waterlogging', tone: 'bad' },
  { label: 'Unsafe at night', tone: 'bad' },
];
export const MAX_TAGS = 6;
export const MAX_TAG_LENGTH = 20;

export const SEASONS = {
  monsoon: 'Monsoon',
  winter: 'Winter',
  summer: 'Summer',
  all_year: 'All year',
};

export const RATING_CATEGORIES = [
  { key: 'surface', label: 'Road surface', hint: '5 = butter smooth' },
  { key: 'scenery', label: 'Scenery', hint: '5 = jaw-dropping' },
  { key: 'traffic', label: 'Traffic', hint: '5 = empty roads' },
  { key: 'safety', label: 'Safety', hint: '5 = very safe' },
];

// Default map view: centred between Mumbai and Pune
export const DEFAULT_CENTER = [18.75, 73.4];
export const DEFAULT_ZOOM = 8;

// Map tiles. OpenStreetMap's own tiles need no API key (fine for development and small sites).
// We darken them with a CSS filter to match the theme. To use another provider later
// (e.g. MapTiler or Stadia with a free key), set VITE_MAP_TILES_URL in client/.env.
const customTiles = import.meta.env.VITE_MAP_TILES_URL;
export const MAP_TILES = {
  url: customTiles ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: import.meta.env.VITE_MAP_TILES_ATTRIBUTION ??
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  darken: !customTiles, // custom providers usually have their own dark style
};
