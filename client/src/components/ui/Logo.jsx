import { Link } from 'react-router-dom';

// The RideRated mark: a speedometer whose scale uses the site's rating colours
// (red = avoid, amber = okay, green = great), with road-marking dashes underneath.
export function LogoMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="none" strokeWidth="7">
        <path d="M10 40 A22 22 0 0 1 19.38 21.98" stroke="#ef4444" />
        <path d="M21.84 20.49 A22 22 0 0 1 42.16 20.49" stroke="#f59e0b" />
        <path d="M44.62 21.98 A22 22 0 0 1 54 40" stroke="#22c55e" />
      </g>
      <path d="M32 40 L45 29.1" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="40" r="5.5" fill="#f97316" stroke="#0a0a0a" strokeWidth="2" />
      <path d="M14 51 h8 M28 51 h8 M42 51 h8" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Mark + "RIDERATED" wordmark, linking home.
export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="RideRated home">
      <LogoMark className="size-10 shrink-0" />
      <span className="font-display text-3xl leading-none tracking-wide">
        Ride<span className="text-brand-500">Rated</span>
      </span>
    </Link>
  );
}
