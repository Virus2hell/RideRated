import { query } from '../db/pool.js';

// GET /api/stats  (numbers for the landing page)
export async function getStats(_req, res) {
  const { rows } = await query(
    `SELECT (SELECT COUNT(*) FROM roads)::int AS roads,
            (SELECT COUNT(*) FROM road_reviews)::int AS reviews,
            (SELECT COUNT(*) FROM users)::int AS riders`,
  );
  res.json(rows[0]);
}
