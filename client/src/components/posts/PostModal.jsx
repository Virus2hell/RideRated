import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import Avatar from '../ui/Avatar';
import UserLink from '../ui/UserLink';
import LikeButton from '../ui/LikeButton';
import PhotoCarousel from './PhotoCarousel';
import { TrashIcon } from '../ui/Icons';

// Full post: photos on the left, author + caption + like on the right (stacked on phones).
export default function PostModal({ post, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMine = user?.id === post.author.id;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['posts', post.author.username] });
    queryClient.invalidateQueries({ queryKey: ['profile', post.author.username] });
  };

  const del = useMutation({
    mutationFn: () => api.delete(`/posts/${post.id}`),
    onSuccess: () => {
      refreshProfile();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/80 p-2 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-3 text-2xl text-zinc-400 hover:text-white" aria-label="Close">✕</button>
      <div
        role="dialog"
        aria-modal="true"
        className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 md:grid-cols-[1fr_340px]"
        onClick={(e) => e.stopPropagation()}
      >
        <PhotoCarousel photos={post.photos} className="aspect-square md:aspect-auto md:h-[80vh]" />
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-3 border-b border-zinc-800 p-4">
            <UserLink username={post.author.username}><Avatar user={post.author} /></UserLink>
            <div className="min-w-0 flex-1 text-sm">
              <UserLink username={post.author.username} className="font-semibold">{post.author.display_name}</UserLink>
              <p className="text-xs text-zinc-500">@{post.author.username} · {timeAgo(post.created_at)}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {post.caption ? (
              <p className="whitespace-pre-line break-words text-zinc-200">{post.caption}</p>
            ) : (
              <p className="text-sm text-zinc-600">No caption</p>
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-zinc-800 p-4">
            <LikeButton endpoint={`/posts/${post.id}/like`} liked={post.liked_by_me} count={post.like_count} onChange={refreshProfile} />
            {isMine && (
              <button
                onClick={() => window.confirm('Delete this post?') && del.mutate()}
                disabled={del.isPending}
                className="ml-auto flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400"
              >
                <TrashIcon /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
