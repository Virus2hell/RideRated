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
import { errorHandler, notFound } from './middleware/errorHandler.js';

export const app = express();

// cross-origin resource policy lets the client (on another domain in production) show uploaded photos
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true })); // credentials: allow cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/stats', getStats);
app.use('/api/auth', authRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/geo', geoRoutes);

app.use(notFound);
app.use(errorHandler);
