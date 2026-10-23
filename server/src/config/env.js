// Centralised, validated config. The app refuses to start with a bad config.
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Free OpenStreetMap geocoders: Photon for road-name search, Nominatim for PIN codes.
  PHOTON_URL: z.string().default('https://photon.komoot.io'),
  NOMINATIM_URL: z.string().default('https://nominatim.openstreetmap.org'),
  // Nominatim's usage policy asks apps to identify themselves with a contact.
  GEOCODER_CONTACT: z.string().default('riderated-dev'),
  // Supabase Storage for photos. If these are empty, photos are saved to server/uploads (dev only:
  // free hosts like Render wipe local files on every deploy/restart).
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default('uploads'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const useSupabaseStorage = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

if (isProd && !useSupabaseStorage) {
  console.warn('WARNING: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; photos will be lost on restart.');
}
