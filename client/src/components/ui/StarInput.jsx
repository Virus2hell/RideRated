import { useState } from 'react';
import { StarIcon } from './Icons';

// Clickable 1-5 star picker with hover preview. Click the same star again to clear (optional ratings).
export default function StarInput({ value, onChange, size = 'size-7', allowClear = true }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value || 0;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(allowClear && value === n ? null : n)}
          className="transition hover:scale-110"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <StarIcon className={`${size} ${n <= shown ? 'text-brand-500' : 'text-zinc-700'}`} />
        </button>
      ))}
    </div>
  );
}
