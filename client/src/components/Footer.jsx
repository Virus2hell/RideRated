import { Link } from 'react-router-dom';
import Logo from './ui/Logo';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-800">
      <div className="road-divider opacity-30" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-zinc-500">Built by riders, for riders. Ride safe, wear your gear.</p>
        </div>
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link to="/explore" className="hover:text-white">Explore</Link>
          <Link to="/feed" className="hover:text-white">Review feed</Link>
          <Link to="/riders" className="hover:text-white">Search riders</Link>
          <Link to="/reviews/new" className="hover:text-white">Rate a road</Link>
        </div>
      </div>
    </footer>
  );
}
