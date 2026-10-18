import { useState } from 'react';
import SafeImage from '../ui/SafeImage';
import { ChevronIcon } from '../ui/Icons';

// Instagram-style photo slider with arrows and dots. Also works with keyboard arrows.
export default function PhotoCarousel({ photos, className = '' }) {
  const [i, setI] = useState(0);
  const go = (d) => setI((cur) => (cur + d + photos.length) % photos.length);

  return (
    <div
      className={`relative bg-black ${className}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
    >
      <SafeImage src={photos[i]} className="size-full object-contain" />
      {photos.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80" aria-label="Previous photo">
            <ChevronIcon direction="left" />
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80" aria-label="Next photo">
            <ChevronIcon />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((p, n) => (
              <button key={p} onClick={() => setI(n)} className={`size-2 rounded-full ${n === i ? 'bg-white' : 'bg-white/40'}`} aria-label={`Photo ${n + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
