import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserSearch } from '../lib/queries';
import useDebounce from '../lib/useDebounce';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import FollowButton from '../components/profile/FollowButton';
import { PinIcon, SearchIcon } from '../components/ui/Icons';

export default function Riders() {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim());
  const { data: users = [], isLoading, isFetching } = useUserSearch(q);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-6xl leading-none tracking-wide">Search riders</h1>
      <p className="mt-1 text-zinc-400">Find riders by username or name and follow their reviews.</p>

      <div className="relative mt-6">
        <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search @username or name…"
          className="input py-3 pl-12 text-lg"
          autoFocus
        />
        {isFetching && <span className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-zinc-700 border-t-brand-500" />}
      </div>

      <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {q ? `Results for "${q}"` : 'Popular riders'}
      </p>

      {isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <p className="card p-8 text-center text-zinc-400">No riders found for "{q}".</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="card flex items-center gap-4 p-4">
              <Link to={`/u/${u.username}`} className="flex min-w-0 flex-1 items-center gap-4">
                <Avatar user={u} size="size-12 text-base" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.display_name}</p>
                  <p className="truncate text-sm text-zinc-500">@{u.username}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                    {u.city && <span className="flex items-center gap-1"><PinIcon className="size-3" /> {u.city}</span>}
                    <span>{u.review_count} review{u.review_count === 1 ? '' : 's'}</span>
                    <span>{u.follower_count} follower{u.follower_count === 1 ? '' : 's'}</span>
                  </p>
                </div>
              </Link>
              <FollowButton key={`${u.id}-${u.is_following}`} username={u.username} isFollowing={u.is_following} size="py-1.5" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
