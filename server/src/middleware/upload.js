import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';

// Always server/uploads, no matter which folder you start the server from.
// (path.resolve('uploads') depended on the current folder, which broke photos when the server
// was started from a different directory.)
export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Saves images to server/uploads with random names. (We move this to Cloudinary before deploying.)
const imageUpload = (maxFiles) =>
  multer({
    storage: multer.diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED[file.mimetype]) cb(null, true);
      else cb(new HttpError(400, 'Only JPG, PNG or WEBP images are allowed'));
    },
  });

export const uploadPhotos = imageUpload(5).array('photos', 5); // review + post photos
export const uploadAvatar = imageUpload(1).single('avatar'); // profile picture
export const uploadBanner = imageUpload(1).single('banner'); // profile banner

// Public URL for a saved file, e.g. "/uploads/abc.jpg"
export const fileUrl = (file) => `/uploads/${file.filename}`;

// Delete a previously uploaded file by its URL. Never throws (the file may already be gone).
export async function deleteUpload(url) {
  if (!url?.startsWith('/uploads/')) return;
  await fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
}
