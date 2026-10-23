import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useReview } from '../lib/queries';
import { formatDate, timeAgo } from '../lib/format';
import { RATING_CATEGORIES, SEASONS } from '../lib/constants';
import Avatar from '../components/ui/Avatar';
import SafeImage from '../components/ui/SafeImage';
import UserLink from '../components/ui/UserLink';
import FollowButton from '../components/profile/FollowButton';
import StarRating from '../components/ui/StarRating';
import TagChip from '../components/ui/TagChip';
import Spinner from '../components/ui/Spinner';
import LikeButton from '../components/ui/LikeButton';
import Comments from '../components/review/Comments';
import { CalendarIcon, PinIcon, TrashIcon } from '../components/ui/Icons';
import NotFound from './NotFound';

export default function ReviewDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: review, isLoading, isError } = useReview(id);
  const [activePhoto, setActivePhoto] = useState(0);

  const del = useMutation({
    mutationFn: () => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      ['reviews', 'roads', 'road', 'stats'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      navigate(`/roads/${review.road.id}`);
    },
  });

  if (isLoading) return <Spinner />;
  if (isError || !review) return <NotFound />;

  const ratings = RATING_CATEGORIES.filter((c) => review[`rating_${c.key}`]);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link to={`/roads/${review.road.id}`} className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-brand-400 hover:underline">
        <PinIcon /> {review.road.name} {review.road.city && <span className="font-normal normal-case text-zinc-500">· {review.road.city}</span>}
      </Link>
      <h1 className="mt-2 font-display text-5xl leading-none tracking-wide sm:text-6xl">{review.title}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <UserLink username={review.author.username}>
          <Avatar user={review.author} size="size-10" />
        </UserLink>
        <div className="text-sm">
          <p className="font-semibold"><UserLink username={review.author.username}>{review.author.display_name}</UserLink></p>
          <p className="text-zinc-500">@{review.author.username} · {timeAgo(review.created_at)}</p>
        </div>
        <FollowButton username={review.author.username} isFollowing={review.author.is_following} size="py-1 text-xs" />
        <StarRating value={review.rating_overall} size="size-6" className="ml-auto" />
      </div>

      {review.photos.length > 0 && (
        <div className="mt-6">
          <SafeImage key={activePhoto} src={review.photos[activePhoto]} className="aspect-[16/10] w-full rounded-2xl object-cover" />
          {review.photos.length > 1 && (
            <div className="mt-3 flex gap-2">
              {review.photos.map((p, i) => (
                <button key={p} onClick={() => setActivePhoto(i)} className={`size-16 overflow-hidden rounded-lg border-2 ${i === activePhoto ? 'border-brand-500' : 'border-transparent opacity-60'}`}>
                  <SafeImage src={p} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-zinc-200">{review.body}</p>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
        {review.ridden_on && <span className="flex items-center gap-1.5"><CalendarIcon /> Ridden {formatDate(review.ridden_on)}</span>}
        {review.best_season && <span>Best in: <span className="text-zinc-200">{SEASONS[review.best_season]}</span></span>}
      </div>

      {ratings.length > 0 && (
        <div className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
          {ratings.map((c) => (
            <div key={c.key} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{c.label}</span>
              <StarRating value={review[`rating_${c.key}`]} />
            </div>
          ))}
        </div>
      )}

      {review.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">{review.tags.map((t) => <TagChip key={t.label} tag={t} />)}</div>
      )}

      <div className="mt-8 flex items-center gap-6 border-y border-zinc-800 py-4">
        <LikeButton endpoint={`/reviews/${review.id}/like`} liked={review.liked_by_me} count={review.like_count} />
        {user?.id === review.author.id && (
          <button
            onClick={() => window.confirm('Delete this review? This cannot be undone.') && del.mutate()}
            className="ml-auto flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400"
          >
            <TrashIcon /> Delete
          </button>
        )}
      </div>

      <Comments reviewId={review.id} />
    </article>
  );
}
