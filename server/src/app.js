import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env, isProd } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import roadRoutes from './routes/roads.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import userRoutes from './routes/users.routes.js';
import postRoutes from './routes/posts.routes.js';
import geoRoutes from './routes/geo.routes.js';
import { getStats } from './controllers/stats.controller.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { query } from './db/pool.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export const app = express();

// cross-origin resource policy lets the client (on another domain in production) show uploaded photos
// Render (and Vercel in front of it) are proxies: trust the X-Forwarded-* headers they add.
app.set('trust proxy', 1);

// cross-origin resource policy lets the client (on another domain in production) show uploaded photos
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// CLIENT_ORIGIN can be a comma-separated list, e.g. your Vercel URL and a custom domain
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

// Local photos (development only; production photos live in Supabase Storage)
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// Health check. It also touches the database, so an uptime pinger keeps the free Supabase
// project active too (free projects pause after a week without activity).
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: 'ok' });
  } catch {
    res.status(503).json({ ok: false, db: 'down' });
  }
});
app.get('/api/stats', getStats);
app.use('/api/auth', authRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/geo', geoRoutes);

app.use(notFound);
app.use(errorHandler);
