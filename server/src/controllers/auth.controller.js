import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { env, isProd } from '../config/env.js';
import { AUTH_COOKIE } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';

const TOKEN_TTL_DAYS = 7;

// Columns that are safe to send to the browser (never password_hash).
const PUBLIC_USER_COLUMNS = `id, username, email, display_name, bio, avatar_url, banner_url, city,
  instagram_url, youtube_url, riding_since, created_at`;

const registerSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_.]{3,30}$/, '3-30 letters, numbers, _ or .'),
  email: z.email().trim(),
  password: z.string().min(8, 'At least 8 characters').max(72),
  displayName: z.string().trim().min(1).max(60),
});

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: `${TOKEN_TTL_DAYS}d` });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true, // not readable from JS, protects against XSS token theft
    secure: isProd,
    // 'lax' works because in production Vercel forwards /api to Render, so the browser sees ONE site
    // (no third-party cookies, which Safari and Chrome block).
    sameSite: 'lax',
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  const { username, email, password, displayName } = registerSchema.parse(req.body);

  const existing = await query('SELECT username, email FROM users WHERE username = $1 OR email = $2', [
    username,
    email,
  ]);
  if (existing.rows.length) {
    const taken = existing.rows[0].email.toLowerCase() === email.toLowerCase() ? 'email' : 'username';
    throw new HttpError(409, `That ${taken} is already taken`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (username, email, password_hash, display_name)
     VALUES ($1, $2, $3, $4) RETURNING ${PUBLIC_USER_COLUMNS}`,
    [username, email, passwordHash, displayName],
  );

  setAuthCookie(res, rows[0].id);
  res.status(201).json({ user: rows[0] });
}

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);

  const { rows } = await query(`SELECT ${PUBLIC_USER_COLUMNS}, password_hash FROM users WHERE email = $1`, [email]);
  const user = rows[0];
  // Same error for "no such user" and "wrong password" so attackers can't probe emails.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  delete user.password_hash;
  setAuthCookie(res, user.id);
  res.json({ user });
}

export function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, secure: isProd, sameSite: 'lax' });
  res.status(204).end();
}

export async function me(req, res) {
  const { rows } = await query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`, [req.user.id]);
  if (!rows[0]) throw new HttpError(401, 'Please log in');
  res.json({ user: rows[0] });
}
