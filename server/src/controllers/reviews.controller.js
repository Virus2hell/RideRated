import { z } from 'zod';
import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { deleteUpload, fileUrl } from '../middleware/upload.js';

// Custom tags: riders write their own (max 20 chars) and mark each green (good) or red (warning).
const tagSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, 'Tags need at least 2 characters')
    .max(20, 'Tags can be at most 20 characters')
    .regex(/^[\p{L}\p{N} &'\-]+$/u, 'Tags can only use letters, numbers, spaces, & - \''),
  tone: z.enum(['good', 'bad']),
});

const tagsSchema = z
  .array(tagSchema)
  .max(6, 'Up to 6 tags')
  .default([])
  .transform((tags) => {
    // drop case-insensitive duplicates ("Potholes" and "potholes")
    const seen = new Set();
    return tags.filter((t) => !seen.has(t.label.toLowerCase()) && seen.add(t.label.toLowerCase()));
  });

const rating = z.coerce.number().int().min(1).max(5);

const createSchema = z
  .object({
    // Either review an existing road, or create a new one by dropping a pin.
    roadId: z.uuid().optional(),
    road: z
      .object({
        name: z.string().trim().min(3, 'Road name needs at least 3 characters').max(100),
        city: z.string().trim().max(60).optional(),
        pincode: z.union([z.literal(''), z.string().trim().regex(/^[1-9]\d{5}$/, 'PIN code must be 6 digits')]).optional(),
        osmId: z.coerce.number().int().positive().optional(), // set when picked from OpenStreetMap search
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180, 'Invalid map location, please drop the pin again'),
      })
      .optional(),
    title: z.string().trim().min(3, 'At least 3 characters').max(120),
    body: z.string().trim().min(10, 'Tell riders a bit more (10+ characters)').max(5000),
    ratingOverall: rating,
    ratingSurface: rating.optional(),
    ratingScenery: rating.optional(),
    ratingTraffic: rating.optional(),
    ratingSafety: rating.optional(),
    riddenOn: z.iso.date().optional(),
    bestSeason: z.enum(['monsoon', 'winter', 'summer', 'all_year']).optional(),
    tags: tagsSchema,
  })
  .refine((d) => d.roadId || d.road, { message: 'Pick a road or drop a pin for a new one', path: ['road'] });

// One query used by the feed, a road's reviews, a user's reviews and a single review.
// $1 is the current user's id (or null) so we can tell if they liked each review.
const REVIEW_SELECT = `
  SELECT r.id, r.title, r.body, r.rating_overall, r.rating_surface, r.rating_scenery,
         r.rating_traffic, r.rating_safety, r.ridden_on, r.best_season, r.tags, r.created_at,
         json_build_object('id', u.id, 'username', u.username, 'display_name', u.display_name,
                           'avatar_url', u.avatar_url,
                           'is_following', EXISTS (SELECT 1 FROM follows f
                                                   WHERE f.follower_id = $1::uuid AND f.following_id = u.id)) AS author,
         json_build_object('id', rd.id, 'name', rd.name, 'city', rd.city, 'pincode', rd.pincode,
                           'lat', ST_Y(rd.location::geometry), 'lng', ST_X(rd.location::geometry)) AS road,
         (SELECT COUNT(*) FROM review_likes l WHERE l.review_id = r.id)::int AS like_count,
         (SELECT COUNT(*) FROM review_comments c WHERE c.review_id = r.id)::int AS comment_count,
         EXISTS (SELECT 1 FROM review_likes l WHERE l.review_id = r.id AND l.user_id = $1::uuid) AS liked_by_me,
         COALESCE((SELECT json_agg(p.url ORDER BY p.position) FROM review_photos p
                   WHERE p.review_id = r.id), '[]') AS photos
  FROM road_reviews r
  JOIN users u ON u.id = r.user_id
  JOIN roads rd ON rd.id = r.road_id`;

const listSchema = z.object({
  feed: z.enum(['all', 'following']).default('all'),
  roadId: z.uuid().optional(),
  username: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// GET /api/reviews?feed=all|following&roadId=&username=&cursor=&limit=
export async function listReviews(req, res) {
  const { feed, roadId, username, cursor, limit } = listSchema.parse(req.query);
  const params = [req.user?.id ?? null];
  const where = [];

  if (feed === 'following') {
    if (!req.user) throw new HttpError(401, 'Please log in');
    where.push('r.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)');
  }

  if (roadId) {
    params.push(roadId);
    where.push(`r.road_id = $${params.length}`);
  }
  if (username) {
    params.push(username);
    where.push(`u.username = $${params.length}`);
  }
  const c = decodeCursor(cursor);
  if (c) {
    params.push(c.createdAt, c.id);
    where.push(`(r.created_at, r.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }

  params.push(limit + 1); // fetch one extra to know if there is a next page
  const { rows } = await query(
    `${REVIEW_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const hasMore = rows.length > limit;
  const reviews = rows.slice(0, limit);
  res.json({ reviews, nextCursor: hasMore ? encodeCursor(reviews.at(-1)) : null });
}

// GET /api/reviews/:id
export async function getReview(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { rows } = await query(`${REVIEW_SELECT} WHERE r.id = $2`, [req.user?.id ?? null, id]);
  if (!rows[0]) throw new HttpError(404, 'Review not found');
  res.json({ review: rows[0] });
}

// POST /api/reviews  (multipart/form-data: "data" = JSON string, "photos" = up to 5 images)
export async function createReview(req, res) {
  const files = req.files ?? [];
  try {
    let raw;
    try {
      raw = JSON.parse(req.body.data ?? '{}');
    } catch {
      throw new HttpError(400, 'Invalid form data');
    }
    const d = createSchema.parse(raw);

    // A transaction: either the road, review and photos are all saved, or none are.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let roadId = d.roadId;
      if (roadId) {
        const exists = await client.query('SELECT 1 FROM roads WHERE id = $1', [roadId]);
        if (!exists.rowCount) throw new HttpError(404, 'Road not found');
      } else {
        // If this OpenStreetMap road is already on RideRated, reuse it instead of creating a duplicate.
        const { rows } = await client.query(
          `INSERT INTO roads (name, city, pincode, osm_id, location, created_by)
           VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7)
           ON CONFLICT (osm_id) DO UPDATE SET osm_id = EXCLUDED.osm_id
           RETURNING id`,
          [d.road.name, d.road.city || null, d.road.pincode || null, d.road.osmId ?? null,
           d.road.lng, d.road.lat, req.user.id],
        );
        roadId = rows[0].id;
      }

      const { rows } = await client.query(
        `INSERT INTO road_reviews (road_id, user_id, title, body, rating_overall, rating_surface,
           rating_scenery, rating_traffic, rating_safety, ridden_on, best_season, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [roadId, req.user.id, d.title, d.body, d.ratingOverall, d.ratingSurface ?? null,
         d.ratingScenery ?? null, d.ratingTraffic ?? null, d.ratingSafety ?? null,
         d.riddenOn ?? null, d.bestSeason ?? null, JSON.stringify(d.tags)],
      );
      const reviewId = rows[0].id;

      for (const [i, file] of files.entries()) {
        await client.query('INSERT INTO review_photos (review_id, url, position) VALUES ($1, $2, $3)', [
          reviewId, fileUrl(file), i,
        ]);
      }

      await client.query('COMMIT');
      res.status(201).json({ id: reviewId, roadId });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Don't leave orphaned photos on disk if saving failed.
    await Promise.all(files.map((f) => deleteUpload(fileUrl(f))));
    throw err;
  }
}

// DELETE /api/reviews/:id  (only the author)
export async function deleteReview(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { rows: photos } = await query(
    `SELECT p.url FROM review_photos p JOIN road_reviews r ON r.id = p.review_id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, req.user.id],
  );
  const { rowCount } = await query('DELETE FROM road_reviews WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (!rowCount) throw new HttpError(404, 'Review not found');

  // Photo rows are removed by ON DELETE CASCADE; remove the files too.
  await Promise.all(photos.map((p) => deleteUpload(p.url)));
  res.status(204).end();
}

// POST /api/reviews/:id/like  and  DELETE /api/reviews/:id/like
export async function likeReview(req, res) {
  const id = z.uuid().parse(req.params.id);
  await query(
    `INSERT INTO review_likes (user_id, review_id)
     SELECT $1, id FROM road_reviews WHERE id = $2
     ON CONFLICT DO NOTHING`,
    [req.user.id, id],
  );
  res.json(await likeState(id, req.user.id));
}

export async function unlikeReview(req, res) {
  const id = z.uuid().parse(req.params.id);
  await query('DELETE FROM review_likes WHERE user_id = $1 AND review_id = $2', [req.user.id, id]);
  res.json(await likeState(id, req.user.id));
}

async function likeState(reviewId, userId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS like_count, COALESCE(bool_or(user_id = $2), false) AS liked_by_me
     FROM review_likes WHERE review_id = $1`,
    [reviewId, userId],
  );
  return rows[0];
}

// GET /api/reviews/:id/comments
// Returns a flat list (oldest first); each comment has parent_id (null = top-level).
// The client groups replies under their top-level comment.
export async function listComments(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { rows } = await query(
    `SELECT c.id, c.body, c.created_at, c.parent_id,
            json_build_object('id', u.id, 'username', u.username, 'display_name', u.display_name,
                              'avatar_url', u.avatar_url) AS author
     FROM review_comments c JOIN users u ON u.id = c.user_id
     WHERE c.review_id = $1
     ORDER BY c.created_at ASC`,
    [id],
  );
  res.json({ comments: rows });
}

// POST /api/reviews/:id/comments   body: { body, parentId? }
export async function addComment(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { body, parentId } = z
    .object({ body: z.string().trim().min(1).max(1000), parentId: z.uuid().optional() })
    .parse(req.body);

  if (parentId) {
    // a reply must belong to the same review
    const { rowCount } = await query('SELECT 1 FROM review_comments WHERE id = $1 AND review_id = $2', [parentId, id]);
    if (!rowCount) throw new HttpError(404, 'The comment you replied to no longer exists');
  }

  const { rows } = await query(
    `INSERT INTO review_comments (review_id, user_id, body, parent_id)
     SELECT id, $2, $3, $4 FROM road_reviews WHERE id = $1
     RETURNING id, body, created_at, parent_id`,
    [id, req.user.id, body, parentId ?? null],
  );
  if (!rows[0]) throw new HttpError(404, 'Review not found');
  const { rows: users } = await query(
    'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
    [req.user.id],
  );
  res.status(201).json({ comment: { ...rows[0], author: users[0] } });
}

// DELETE /api/reviews/:id/comments/:commentId  (only the comment's author)
export async function deleteComment(req, res) {
  const commentId = z.uuid().parse(req.params.commentId);
  const { rowCount } = await query('DELETE FROM review_comments WHERE id = $1 AND user_id = $2', [
    commentId, req.user.id,
  ]);
  if (!rowCount) throw new HttpError(404, 'Comment not found');
  res.status(204).end();
}
