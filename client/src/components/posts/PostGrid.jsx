import { useState } from 'react';
import { usePosts } from '../../lib/queries';
import SafeImage from '../ui/SafeImage';
import Spinner from '../ui/Spinner';
import PostModal from './PostModal';
import NewPostModal from './NewPostModal';
import { HeartIcon, ImagesIcon, PlusIcon } from '../ui/Icons';

// Instagram-style 3-column grid of a rider's posts.
export default function PostGrid({ username, isMe }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(username);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <Spinner />;
  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const open = posts.find((p) => p.id === openId);

  return (
    <>
      {isMe && (
        <button onClick={() => setCreating(true)} className="btn-primary mb-5"><PlusIcon /> New post</button>
      )}

      {posts.length === 0 ? (
        <p className="card p-8 text-center text-zinc-400">
          {isMe ? 'Share photos of your bike and your rides. Your first post is one click away.' : 'No posts yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post) => (
            <button key={post.id} onClick={() => setOpenId(post.id)} aria-label="Open post" className="group relative aspect-square overflow-hidden rounded-md bg-zinc-900">
              <SafeImage src={post.photos[0]} alt={post.caption ?? ''} className="size-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
              {post.photos.length > 1 && <ImagesIcon className="absolute right-2 top-2 size-5 drop-shadow" />}
              <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                <span className="flex items-center gap-1.5 font-semibold"><HeartIcon filled className="size-5" /> {post.like_count}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-6 text-center">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-ghost">
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {open && <PostModal key={open.id} post={open} onClose={() => setOpenId(null)} />}
      {creating && <NewPostModal onClose={() => setCreating(false)} />}
    </>
  );
}
