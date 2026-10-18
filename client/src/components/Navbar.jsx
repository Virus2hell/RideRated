import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './ui/Logo';
import Avatar from './ui/Avatar';
import { EditIcon, MenuIcon, PlusIcon, UserIcon } from './ui/Icons';

const links = [
  { to: '/explore', label: 'Explore map' },
  { to: '/feed', label: 'Review feed' },
  { to: '/riders', label: 'Search riders' },
];

const navClass = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`;

// Avatar button with a dropdown: profile, edit profile, log out.
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // close after navigating
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-zinc-900" aria-expanded={open}>
        <Avatar user={user} size="size-8" />
        <span className="text-sm text-zinc-300">@{user.username}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl">
          <Link to={`/u/${user.username}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-800"><UserIcon /> My profile</Link>
          <Link to="/settings/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-800"><EditIcon /> Edit profile</Link>
          <button onClick={onLogout} className="block w-full border-t border-zinc-800 px-4 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] border-b border-zinc-800/80 bg-asphalt/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-3">
        <Logo />

        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>)}
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/reviews/new" className="btn-primary">
                <PlusIcon /> Rate a road
              </Link>
              <UserMenu user={user} onLogout={() => logout.mutate()} />
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>Log in</NavLink>
              <Link to="/register" className="btn-primary">Join the pack</Link>
            </>
          )}
        </div>

        <button className="ml-auto md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <MenuIcon />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="space-y-1 border-t border-zinc-800 px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {links.map((l) => <NavLink key={l.to} to={l.to} className="block py-2 text-zinc-300">{l.label}</NavLink>)}
          {user ? (
            <>
              <Link to="/reviews/new" className="block py-2 font-semibold text-brand-400">+ Rate a road</Link>
              <Link to={`/u/${user.username}`} className="block py-2 text-zinc-300">My profile</Link>
              <Link to="/settings/profile" className="block py-2 text-zinc-300">Edit profile</Link>
              <button onClick={() => logout.mutate()} className="block py-2 text-zinc-500">Log out @{user.username}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-zinc-300">Log in</Link>
              <Link to="/register" className="block py-2 font-semibold text-brand-400">Join the pack</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
