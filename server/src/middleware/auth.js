import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export const AUTH_COOKIE = 'rr_token';

// Sets req.user = { id } when a valid token cookie is present; never rejects.
export function optionalAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.user = { id: payload.sub };
    } catch {
      // invalid/expired token: treat as logged out
    }
  }
  next();
}

// Rejects the request with 401 unless the user is logged in.
export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return next(new HttpError(401, 'Please log in'));
    next();
  });
}
