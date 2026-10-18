import { z } from 'zod';
import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { deleteUpload, fileUrl } from '../middleware/upload.js';

// $1 = the viewer's id (or null), used for liked_by_me.
const POST_SELECT = `
  SELECT p.id, p.caption, p.created_at,
         json_build_object('id', u.id, 'username', u.username, 'display_name', u.display_name,
                           'avatar_url', u.avatar_url) AS author,
         COALESCE((SELECT json_agg(ph.url ORDER BY ph.position) FROM post_photos ph WHERE ph.post_id = p.id), '[]') AS photos,
         (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id)::int AS like_count,
         EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1::uuid) AS liked_by_me
  FROM posts p
  JOIN users u ON u.id = p.user_id`;

// GET /api/posts?username=&cursor=&limit=
export async function listPosts(req, res) {
  const { username, cursor, limit } = z
    .object({
      username: z.string().min(1),
      cursor: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(60).default(12),
    })
    .parse(req.query);

  const params = [req.user?.id ?? null, username];
  const where = ['u.username = $2'];
  const c = decodeCursor(cursor);
  if (c) {
    params.push(c.createdAt, c.id);
    where.push(`(p.created_at, p.id) < ($3::timestamptz, $4::uuid)`);
  }
  params.push(limit + 1);
  const { rows } = await query(
    `${POST_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`,
    params,
  );
  const hasMore = rows.length > limit;
  const posts = rows.slice(0, limit);
  res.json({ posts, nextCursor: hasMore ? encodeCursor(posts.at(-1)) : null });
}

// GET /api/posts/:id
export async function getPost(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { rows } = await query(`${POST_SELECT} WHERE p.id = $2`, [req.user?.id ?? null, id]);
  if (!rows[0]) throw new HttpError(404, 'Post not found');
  res.json({ post: rows[0] });
}

// POST /api/posts  (multipart: "caption" + 1-5 "photos")
export async function createPost(req, res) {
  const files = req.files ?? [];
  try {
    if (!files.length) throw new HttpError(400, 'Add at least one photo');
    const { caption } = z
      .object({ caption: z.string().trim().max(1000, 'Keep the caption under 1000 characters').optional() })
      .parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: [post] } = await client.query(
        'INSERT INTO posts (user_id, caption) VALUES ($1, $2) RETURNING id',
        [req.user.id, caption || null],
      );
      for (const [i, file] of files.entries()) {
        await client.query('INSERT INTO post_photos (post_id, url, position) VALUES ($1, $2, $3)', [post.id, fileUrl(file), i]);
      }
      await client.query('COMMIT');
      res.status(201).json({ id: post.id });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    await Promise.all(files.map((f) => deleteUpload(fileUrl(f))));
    throw err;
  }
}

// DELETE /api/posts/:id  (author only)
export async function deletePost(req, res) {
  const id = z.uuid().parse(req.params.id);
  const { rows: photos } = await query(
    `SELECT ph.url FROM post_photos ph JOIN posts p ON p.id = ph.post_id WHERE p.id = $1 AND p.user_id = $2`,
    [id, req.user.id],
  );
  const { rowCount } = await query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (!rowCount) throw new HttpError(404, 'Post not found');
  await Promise.all(photos.map((p) => deleteUpload(p.url)));
  res.status(204).end();
}

async function likeState(postId, userId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS like_count, COALESCE(bool_or(user_id = $2), false) AS liked_by_me
     FROM post_likes WHERE post_id = $1`,
    [postId, userId],
  );
  return rows[0];
}

// POST /api/posts/:id/like   and   DELETE /api/posts/:id/like
export async function likePost(req, res) {
  const id = z.uuid().parse(req.params.id);
  await query(
    `INSERT INTO post_likes (user_id, post_id) SELECT $1, id FROM posts WHERE id = $2 ON CONFLICT DO NOTHING`,
    [req.user.id, id],
  );
  res.json(await likeState(id, req.user.id));
}

export async function unlikePost(req, res) {
  const id = z.uuid().parse(req.params.id);
  await query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [req.user.id, id]);
  res.json(await likeState(id, req.user.id));
}
