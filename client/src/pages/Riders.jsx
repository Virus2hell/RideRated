import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserSearch } from '../lib/queries';
import useDebounce from '../lib/useDebounce';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import InfiniteScroll from '../components/ui/InfiniteScroll';
import FollowButton from '../components/profile/FollowButton';
import { PinIcon, SearchIcon } from '../components/ui/Icons';

function RiderCard({ user }) {
  return (
    <li className="card flex flex-col items-center p-6 text-center transition hover:border-zinc-700">
      <Link to={`/u/${user.username}`} className="flex flex-col items-center">
        <Avatar user={user} size="size-20 text-xl" />
        <p className="mt-3 max-w-full truncate font-display text-2xl leading-none tracking-wide">{user.display_name}</p>
        <p className="max-w-full truncate text-sm text-zinc-500">@{user.username}</p>
      </Link>
      <p className="mt-1 flex h-5 items-center gap-1 text-xs text-zinc-500">
        {user.city && <><PinIcon className="size-3" /> {user.city}</>}
      </p>
      {/* line-clamp keeps every card the same height even with long bios */}
      <p className="mt-2 line-clamp-2 h-10 text-sm text-zinc-400">{user.bio}</p>
      <div className="my-4 flex gap-6 text-sm">
        <span><b className="text-white">{user.review_count}</b> <span className="text-zinc-500">reviews</span></span>
        <span><b className="text-white">{user.follower_count}</b> <span className="text-zinc-500">followers</span></span>
      </div>
      <FollowButton key={`${user.id}-${user.is_following}`} username={user.username} isFollowing={user.is_following} size="w-full" />
    </li>
  );
}

export default function Riders() {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim());
  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } = useUserSearch(q);
  const users = data?.pages.flatMap((p) => p.users) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-6xl leading-none tracking-wide">Search riders</h1>
      <p className="mt-1 text-zinc-400">Find riders by username or name and follow their reviews.</p>

      <div className="relative mt-6 max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search @username or name…"
          className="input py-3 pl-12 text-lg"
          autoFocus
        />
        {isFetching && !isFetchingNextPage && (
          <span className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-zinc-700 border-t-brand-500" />
        )}
      </div>

      <p className="mb-4 mt-8 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {q ? `Results for "${q}"` : 'Popular riders'}
      </p>

      {isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <p className="card p-8 text-center text-zinc-400">No riders found for "{q}".</p>
      ) : (
        <>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => <RiderCard key={u.id} user={u} />)}
          </ul>
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            endMessage={data.pages.length > 1 ? 'No more riders' : null}
          />
        </>
      )}
    </div>
  );
}
