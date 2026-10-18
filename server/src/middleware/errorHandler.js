import { ZodError, z } from 'zod';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';

const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: 'Each photo must be under 5 MB',
  LIMIT_FILE_COUNT: 'You can upload up to 5 photos',
  LIMIT_UNEXPECTED_FILE: 'You can upload up to 5 photos',
};

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Express 5 forwards errors from async handlers here automatically.
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: z.flattenError(err).fieldErrors });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: UPLOAD_ERRORS[err.code] ?? err.message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Already exists' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}
