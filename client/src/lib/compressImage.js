// Shrinks photos in the browser before uploading: phone photos are often 5-10 MB,
// which is slow on mobile data and too big to send through the hosting proxy.
// Result: max 1920px on the long side, JPEG ~80% quality, usually 200-500 KB. Looks the same on screen.
const MAX_SIDE = 1920;

export async function compressImage(file, { maxSide = MAX_SIDE, quality = 0.8 } = {}) {
  // Small files are left alone (also keeps PNG logos/screenshots crisp).
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) return file;
  try {
    // imageOrientation 'from-image' respects the phone's rotation info (EXIF), so photos aren't sideways
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // compression didn't help
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // unsupported format or old browser: upload the original
  }
}

export const compressImages = (files) => Promise.all(files.map((f) => compressImage(f)));
