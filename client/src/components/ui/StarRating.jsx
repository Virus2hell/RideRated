import { StarIcon } from './Icons';

// Read-only stars. Supports fractions: 3.6 shows three full stars and a 60% star.
export default function StarRating({ value = 0, size = 'size-4', className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={`relative ${size}`}>
            <StarIcon className={`absolute inset-0 ${size} text-zinc-700`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarIcon className={`${size} text-brand-500`} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
