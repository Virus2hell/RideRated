import { z } from 'zod';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';

// PostGIS stores (lng, lat); ST_Y = latitude, ST_X = longitude.
const ROAD_COLUMNS = `rd.id, rd.name, rd.city, rd.pincode, rd.created_at,
  ST_Y(rd.location::geometry) AS lat, ST_X(rd.location::geometry) AS lng`;

const STATS = `COUNT(r.id)::int AS review_count,
  ROUND(AVG(r.rating_overall), 1)::float AS avg_rating`;

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).default(50),
  sort: z.enum(['popular', 'top', 'worst', 'nearest']).default('popular'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

// GET /api/roads?q=&lat=&lng=&radiusKm=&sort=
export async function listRoads(req, res) {
  const { q, lat, lng, radiusKm, sort, limit } = listSchema.parse(req.query);
  const params = [];
  const where = [];
  let distance = 'NULL::float AS distance_km';

  if (lat !== undefined && lng !== undefined) {
    params.push(lng, lat);
    const point = `ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography`;
    distance = `ROUND((ST_Distance(rd.location, ${point}) / 1000)::numeric, 1)::float AS distance_km`;
    params.push(radiusKm * 1000);
    where.push(`ST_DWithin(rd.location, ${point}, $${params.length})`); // uses the GIST index
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(rd.name ILIKE $${params.length} OR rd.city ILIKE $${params.length} OR rd.pincode = $${params.length + 1})`);
    params.push(q);
  }

  const orderBy = {
    popular: 'review_count DESC, avg_rating DESC NULLS LAST',
    top: 'avg_rating DESC NULLS LAST, review_count DESC',
    worst: 'avg_rating ASC NULLS LAST, review_count DESC',
    nearest: lat !== undefined ? 'distance_km ASC' : 'review_count DESC',
  }[sort];

  params.push(limit);
  const { rows } = await query(
    `SELECT ${ROAD_COLUMNS}, ${STATS}, ${distance}
     FROM roads rd
     LEFT JOIN road_reviews r ON r.road_id = rd.id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY rd.id
     ORDER BY ${orderBy}
     LIMIT $${params.length}`,
    params,
  );
  res.json({ roads: rows });
}

// GET /api/roads/:id  (road + average of every rating category + most used tags)
export async function getRoad(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { rows } = await query(
    `SELECT ${ROAD_COLUMNS}, ${STATS},
       ROUND(AVG(r.rating_surface), 1)::float AS avg_surface,
       ROUND(AVG(r.rating_scenery), 1)::float AS avg_scenery,
       ROUND(AVG(r.rating_traffic), 1)::float AS avg_traffic,
       ROUND(AVG(r.rating_safety), 1)::float AS avg_safety,
       MAX(r.ridden_on) AS last_ridden_on,
       -- most used tags across all reviews of this road (case-insensitive)
       (SELECT COALESCE(json_agg(json_build_object('label', t.label, 'tone', t.tone) ORDER BY t.n DESC), '[]') FROM (
          SELECT MIN(tag->>'label') AS label, MIN(tag->>'tone') AS tone, COUNT(*) AS n
          FROM road_reviews, jsonb_array_elements(tags) AS tag
          WHERE road_id = rd.id GROUP BY lower(tag->>'label') ORDER BY n DESC LIMIT 8) t) AS top_tags
     FROM roads rd
     LEFT JOIN road_reviews r ON r.road_id = rd.id
     WHERE rd.id = $1
     GROUP BY rd.id`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, 'Road not found');
  res.json({ road: rows[0] });
}
