const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 31536000], ['month', 2592000], ['week', 604800],
  ['day', 86400], ['hour', 3600], ['minute', 60],
];

// "3 hours ago", "yesterday", "2 weeks ago"
export function timeAgo(date) {
  const seconds = (new Date(date) - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

// "12 Oct 2026" from "2026-10-12"
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Colour for a 1-5 rating: red (bad road) → amber → green (great road)
export function ratingColor(rating) {
  if (rating == null) return '#71717a';
  if (rating >= 4) return '#22c55e';
  if (rating >= 3) return '#f59e0b';
  return '#ef4444';
}
