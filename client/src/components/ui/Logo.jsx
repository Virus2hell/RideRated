import { Link } from 'react-router-dom';

// A winding road with a dashed centre line, plus the wordmark.
export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="7" className="fill-zinc-900" />
        <path d="M9 28 C13 20 19 14 16 4 L18 4 C23 14 19 20 23 28 Z" className="fill-brand-500" />
        <path d="M16 26 L17 22 M17.5 18 L17.6 14 M17.3 10 L17 7" className="stroke-zinc-950" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-display text-3xl leading-none tracking-wide">
        Ride<span className="text-brand-500">Rated</span>
      </span>
    </Link>
  );
}
