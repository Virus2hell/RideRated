import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="px-4 py-24 text-center">
      <p className="font-display text-[160px] leading-none text-zinc-800">404</p>
      <h1 className="font-display text-5xl tracking-wide">Wrong turn, rider</h1>
      <p className="mt-2 text-zinc-400">This road doesn't exist. Yet.</p>
      <Link to="/" className="btn-primary mt-8">Back to base</Link>
    </div>
  );
}
