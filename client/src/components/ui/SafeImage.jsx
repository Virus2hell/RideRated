import { useState } from 'react';
import { mediaUrl } from '../../lib/api';
import { CameraIcon } from './Icons';

// <img> that shows a neutral placeholder instead of a broken-image icon if the file is missing.
export default function SafeImage({ src, alt = '', className = '', ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-zinc-800 text-zinc-600 ${className}`} role="img" aria-label={alt || 'Image unavailable'}>
        <CameraIcon className="size-8" />
      </div>
    );
  }
  return <img src={mediaUrl(src)} alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
