// Road-name search and PIN code lookup, using free OpenStreetMap services.
// The browser calls our API, and our API calls OSM: that lets us cache results,
// send the identifying User-Agent OSM requires, and swap providers without touching the client.
import { z } from 'zod';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const USER_AGENT = `RideRated/0.1 (${env.GEOCODER_CONTACT})`;
const INDIA_BBOX = '68.1,6.5,97.4,35.7'; // minLon,minLat,maxLon,maxLat
const MAHARASHTRA = { lat: 19.0, lng: 74.5 }; // results near here rank higher

// Tiny in-memory cache: same search twice = no second request to OSM.
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fn();
  if (cache.size > 2000) cache.delete(cache.keys().next().value); // drop the oldest entry
  cache.set(key, { value, expires: Date.now() + CACHE_TTL });
  return value;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

const validPin = (v) => (typeof v === 'string' && /^[1-9]\d{5}$/.test(v.trim()) ? v.trim() : null);
const unique = (arr) => [...new Set(arr.filter(Boolean))];

// Photon (photon.komoot.io): search-as-you-type over OpenStreetMap. osm_tag=highway = roads only.
async function photonRoads(q, near) {
  const url = new URL('/api', env.PHOTON_URL);
  url.search = new URLSearchParams({
    q, limit: '15', lang: 'en', bbox: INDIA_BBOX, osm_tag: 'highway',
    lat: String(near.lat), lon: String(near.lng),
  });
  const data = await getJson(url);
  const seen = new Set();
  const roads = [];
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    if (!p.name || p.countrycode?.toUpperCase() !== 'IN') continue;
    const city = p.city || p.county || p.district || p.state || null;
    const key = `${p.name.toLowerCase()}|${city}`;
    if (seen.has(key)) continue; // OSM splits long roads into many pieces with the same name
    seen.add(key);
    const [lng, lat] = f.geometry.coordinates;
    roads.push({
      osmId: p.osm_type === 'W' ? p.osm_id : null,
      name: p.name,
      kind: p.osm_value, // primary, trunk, residential, ...
      area: unique([p.locality || p.district, city, p.state]).join(', '),
      city,
      pincode: validPin(p.postcode),
      lat,
      lng,
    });
  }
  return roads.slice(0, 8);
}

// GET /api/geo/roads?q=&lat=&lng=   (roads anywhere in India, nearest to lat/lng ranked first)
export async function searchRoads(req, res) {
  const { q, lat, lng } = z
    .object({
      q: z.string().trim().min(2).max(100),
      lat: z.coerce.number().min(-90).max(90).optional(),
      lng: z.coerce.number().min(-180).max(180).optional(),
    })
    .parse(req.query);
  const near = lat !== undefined && lng !== undefined ? { lat, lng } : MAHARASHTRA;

  let roads;
  try {
    roads = await cached(`roads|${q.toLowerCase()}|${near.lat.toFixed(1)}|${near.lng.toFixed(1)}`, () => photonRoads(q, near));
  } catch (err) {
    console.error('Road search failed:', err.message);
    return res.json({ roads: [], unavailable: true }); // the form still works with the map
  }

  // Mark roads that already exist on RideRated so the rider reviews those instead of making duplicates.
  const osmIds = roads.map((r) => r.osmId).filter(Boolean);
  if (osmIds.length) {
    const { rows } = await query(
      `SELECT rd.osm_id, rd.id, ROUND(AVG(r.rating_overall), 1)::float AS avg_rating
       FROM roads rd LEFT JOIN road_reviews r ON r.road_id = rd.id
       WHERE rd.osm_id = ANY($1::bigint[]) GROUP BY rd.id`,
      [osmIds],
    );
    const byOsm = new Map(rows.map((r) => [String(r.osm_id), r]));
    for (const road of roads) {
      const match = byOsm.get(String(road.osmId));
      if (match) Object.assign(road, { roadId: match.id, avg_rating: match.avg_rating });
    }
  }
  res.json({ roads });
}

// Nominatim allows at most 1 request per second, so space our calls out.
let lastNominatim = 0;
async function nominatimPin(pin) {
  const wait = lastNominatim + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatim = Date.now();

  const url = new URL('/search', env.NOMINATIM_URL);
  url.search = new URLSearchParams({ postalcode: pin, countrycodes: 'in', format: 'jsonv2', addressdetails: '1', limit: '1' });
  const [hit] = await getJson(url);
  if (!hit) return null;
  const a = hit.address ?? {};
  return {
    pincode: pin,
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    city: a.city || a.town || a.state_district || a.county || a.village || a.suburb || null,
    state: a.state ?? null,
  };
}

// Fallback: Photon also indexes postcodes.
async function photonPin(pin) {
  const url = new URL('/api', env.PHOTON_URL);
  url.search = new URLSearchParams({ q: pin, limit: '5', lang: 'en', bbox: INDIA_BBOX });
  const data = await getJson(url);
  const f = (data.features ?? []).find((x) => x.properties?.postcode === pin) ?? null;
  if (!f) return null;
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  return { pincode: pin, lat, lng, city: p.city || p.county || p.district || null, state: p.state ?? null };
}

// GET /api/geo/pincode/:pin
export async function lookupPincode(req, res) {
  const pin = validPin(req.params.pin);
  if (!pin) throw new HttpError(400, 'Enter a valid 6-digit PIN code');

  const place = await cached(`pin|${pin}`, async () => {
    try {
      return (await nominatimPin(pin)) ?? (await photonPin(pin));
    } catch (err) {
      console.error('PIN lookup failed:', err.message);
      return photonPin(pin).catch(() => null);
    }
  });
  if (!place) throw new HttpError(404, "Couldn't find that PIN code. Drop the pin on the map instead.");
  res.json({ place });
}
