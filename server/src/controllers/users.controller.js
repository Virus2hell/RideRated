import { z } from 'zod';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';
import { deleteUpload, fileUrl } from '../middleware/upload.js';

export const PROFILE_COLUMNS = `id, username, email, display_name, bio, avatar_url, banner_url, city,
  instagram_url, youtube_url, riding_since, created_at`;

// Accepts "instagram.com/name" or "https://www.instagram.com/name"; empty string clears the link.
const socialUrl = (hosts, label) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() && !/^https?:\/\//i.test(v.trim()) ? `https://${v.trim()}` : v),
    z.union([
      z.literal(''),
      z.url().refine((u) => hosts.includes(new URL(u).hostname.replace(/^(www|m)\./, '')), `Must be ${label} link`),
    ]),
  );

const updateSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required').max(60),
  bio: z.string().trim().max(300, 'Keep your bio under 300 characters').optional(),
  city: z.string().trim().max(60).optional(),
  instagramUrl: socialUrl(['instagram.com'], 'an Instagram').optional(),
  youtubeUrl: socialUrl(['youtube.com', 'youtu.be'], 'a YouTube').optional(),
  ridingSince: z.union([z.literal(''), z.coerce.number().int().min(1950).max(new Date().getFullYear())]).optional(),
});

const empty = (v) => (v === '' || v === undefined ? null : v);

async function findUserId(username) {
  const { rows } = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (!rows[0]) throw new HttpError(404, 'Rider not found');
  return rows[0].id;
}

// GET /api/users/:username  (public profile + counts + whether I follow them)
export async function getProfile(req, res) {
  const { rows } = await query(
    `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.banner_url, u.city, u.instagram_url,
            u.youtube_url, u.riding_since, u.created_at,
            (SELECT COUNT(*) FROM road_reviews r WHERE r.user_id = u.id)::int AS review_count,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id)::int AS post_count,
            (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id)::int AS follower_count,
            (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id)::int AS following_count,
            (SELECT COUNT(*) FROM review_likes l JOIN road_reviews r ON r.id = l.review_id
              WHERE r.user_id = u.id)::int AS likes_received,
            EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $2::uuid AND f.following_id = u.id) AS is_following
     FROM users u WHERE u.username = $1`,
    [req.params.username, req.user?.id ?? null],
  );
  if (!rows[0]) throw new HttpError(404, 'Rider not found');
  res.json({ user: rows[0] });
}

// PATCH /api/users/me
export async function updateMe(req, res) {
  const d = updateSchema.parse(req.body);
  const { rows } = await query(
    `UPDATE users SET display_name = $2, bio = $3, city = $4, instagram_url = $5, youtube_url = $6,
       riding_since = $7, updated_at = now()
     WHERE id = $1 RETURNING ${PROFILE_COLUMNS}`,
    [req.user.id, d.displayName, empty(d.bio), empty(d.city), empty(d.instagramUrl),
     empty(d.youtubeUrl), empty(d.ridingSince)],
  );
  res.json({ user: rows[0] });
}

// Profile images: avatar_url or banner_url. Replacing one deletes the old file.
function setImage(column) {
  return async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose an image');
    const { rows: [old] } = await query(`SELECT ${column} AS url FROM users WHERE id = $1`, [req.user.id]);
    const { rows } = await query(
      `UPDATE users SET ${column} = $2, updated_at = now() WHERE id = $1 RETURNING ${PROFILE_COLUMNS}`,
      [req.user.id, fileUrl(req.file)],
    );
    await deleteUpload(old?.url);
    res.json({ user: rows[0] });
  };
}

function removeImage(column) {
  return async (req, res) => {
    const { rows: [old] } = await query(`SELECT ${column} AS url FROM users WHERE id = $1`, [req.user.id]);
    const { rows } = await query(
      `UPDATE users SET ${column} = NULL, updated_at = now() WHERE id = $1 RETURNING ${PROFILE_COLUMNS}`,
      [req.user.id],
    );
    await deleteUpload(old?.url);
    res.json({ user: rows[0] });
  };
}

// POST/DELETE /api/users/me/avatar   and   /api/users/me/banner
export const updateAvatar = setImage('avatar_url');
export const removeAvatar = removeImage('avatar_url');
export const updateBanner = setImage('banner_url');
export const removeBanner = removeImage('banner_url');

// GET /api/users?q=   (search riders by username or name; no q = most active riders)
export async function searchUsers(req, res) {
  const { q } = z.object({ q: z.string().trim().max(50).optional() }).parse(req.query);
  const term = q?.replace(/^@/, '');
  const { rows } = await query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.city, u.bio,
            (SELECT COUNT(*) FROM road_reviews r WHERE r.user_id = u.id)::int AS review_count,
            (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id)::int AS follower_count,
            EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $1::uuid AND f.following_id = u.id) AS is_following
     FROM users u
     WHERE ($2::text IS NULL OR u.username ILIKE '%' || $2 || '%' OR u.display_name ILIKE '%' || $2 || '%')
       AND u.id IS DISTINCT FROM $1::uuid
     ORDER BY
       CASE WHEN $2::text IS NOT NULL AND lower(u.username) = lower($2) THEN 0      -- exact username first
            WHEN $2::text IS NOT NULL AND u.username ILIKE $2 || '%' THEN 1 ELSE 2 END, -- then "starts with"
       follower_count DESC, review_count DESC, u.created_at DESC
     LIMIT 20`,
    [req.user?.id ?? null, term || null],
  );
  res.json({ users: rows });
}

// ---------- Follows ----------

async function followState(userId, viewerId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS follower_count, COALESCE(bool_or(follower_id = $2), false) AS is_following
     FROM follows WHERE following_id = $1`,
    [userId, viewerId],
  );
  return rows[0];
}

// POST /api/users/:username/follow
export async function follow(req, res) {
  const targetId = await findUserId(req.params.username);
  if (targetId === req.user.id) throw new HttpError(400, "You can't follow yourself");
  await query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
    req.user.id, targetId,
  ]);
  res.json(await followState(targetId, req.user.id));
}

// DELETE /api/users/:username/follow
export async function unfollow(req, res) {
  const targetId = await findUserId(req.params.username);
  await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, targetId]);
  res.json(await followState(targetId, req.user.id));
}

// GET /api/users/:username/followers  and  /following
export function listFollows(direction) {
  // followers: people who follow this user; following: people this user follows
  const [match, show] = direction === 'followers' ? ['following_id', 'follower_id'] : ['follower_id', 'following_id'];
  return async (req, res) => {
    const userId = await findUserId(req.params.username);
    const { rows } = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.city,
              EXISTS (SELECT 1 FROM follows x WHERE x.follower_id = $2::uuid AND x.following_id = u.id) AS is_following
       FROM follows f JOIN users u ON u.id = f.${show}
       WHERE f.${match} = $1
       ORDER BY f.created_at DESC
       LIMIT 200`,
      [userId, req.user?.id ?? null],
    );
    res.json({ users: rows });
  };
}
