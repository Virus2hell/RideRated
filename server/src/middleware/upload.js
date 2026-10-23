import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { env, useSupabaseStorage } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

// Local folder for development (always server/uploads, no matter where you start the server from).
export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// ---------- Where files are stored ----------
// Production: Supabase Storage (a public bucket). Development: the server/uploads folder.
const supabase = useSupabaseStorage
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;
const bucket = env.SUPABASE_BUCKET;
const publicPrefix = useSupabaseStorage ? `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/` : null;

// Create the public bucket on first start, so there's nothing to click in the Supabase dashboard.
export async function ensureBucket() {
  if (!supabase) return;
  const { error } = await supabase.storage.getBucket(bucket);
  if (!error) return;
  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: Object.keys(ALLOWED),
  });
  if (createError) console.error(`Could not create storage bucket "${bucket}":`, createError.message);
  else console.log(`Created public storage bucket "${bucket}"`);
}

async function saveFile(file) {
  const name = crypto.randomUUID() + ALLOWED[file.mimetype];
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).upload(name, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '31536000', // a file never changes (new upload = new name), so cache it for a year
    });
    if (error) throw new HttpError(502, `Photo upload failed: ${error.message}`);
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  }
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return `/uploads/${name}`;
}

// Delete a previously uploaded file by its URL. Never throws (the file may already be gone).
export async function deleteUpload(url) {
  if (!url) return;
  try {
    if (url.startsWith('/uploads/')) {
      await fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(url)));
    } else if (supabase && url.startsWith(publicPrefix)) {
      await supabase.storage.from(bucket).remove([url.slice(publicPrefix.length)]);
    }
  } catch {
    // already gone: nothing to do
  }
}

// ---------- Middleware ----------
// multer reads the files into memory and checks type/size, then storeFiles saves them
// (to Supabase or disk) and puts the public URL on each file as file.url.
const imageUpload = (maxFiles) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED[file.mimetype]) cb(null, true);
      else cb(new HttpError(400, 'Only JPG, PNG or WEBP images are allowed'));
    },
  });

async function storeFiles(req, _res, next) {
  const files = req.files ?? (req.file ? [req.file] : []);
  const saved = [];
  try {
    for (const file of files) {
      file.url = await saveFile(file);
      file.buffer = undefined; // free the memory
      saved.push(file.url);
    }
    next();
  } catch (err) {
    await Promise.all(saved.map(deleteUpload)); // don't leave half an upload behind
    next(err);
  }
}

// Arrays of middleware: Express runs them in order.
export const uploadPhotos = [imageUpload(5).array('photos', 5), storeFiles]; // review + post photos
export const uploadAvatar = [imageUpload(1).single('avatar'), storeFiles]; // profile picture
export const uploadBanner = [imageUpload(1).single('banner'), storeFiles]; // profile banner

// Public URL of a stored file: "/uploads/abc.jpg" in dev, "https://…supabase.co/storage/…" in production
export const fileUrl = (file) => file.url;
