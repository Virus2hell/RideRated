import { Link } from 'react-router-dom';
import { mediaUrl } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import Avatar from '../ui/Avatar';
import UserLink from '../ui/UserLink';
import StarRating from '../ui/StarRating';
import TagChip from '../ui/TagChip';
import LikeButton from '../ui/LikeButton';
import { CommentIcon, PinIcon } from '../ui/Icons';

export default function ReviewCard({ review, showRoad = true }) {
  const cover = review.photos[0];

  return (
    <article className="card group overflow-hidden transition hover:border-zinc-700">
      <Link to={`/reviews/${review.id}`} className="block">
        {cover && (
          <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
            <img src={mediaUrl(cover)} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
            {review.photos.length > 1 && (
              <span className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-xs">+{review.photos.length - 1}</span>
            )}
          </div>
        )}

        <div className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <UserLink username={review.author.username} inCard>
              <Avatar user={review.author} size="size-8" />
            </UserLink>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold">
                <UserLink username={review.author.username} inCard>{review.author.display_name}</UserLink>
              </p>
              <p className="text-xs text-zinc-500">@{review.author.username} · {timeAgo(review.created_at)}</p>
            </div>
            <StarRating value={review.rating_overall} />
          </div>

          {showRoad && (
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-400">
              <PinIcon className="size-3.5" />
              {review.road.name}
              {review.road.city && <span className="font-normal normal-case tracking-normal text-zinc-500">· {review.road.city}</span>}
            </p>
          )}
          <h3 className="text-lg font-bold leading-snug">{review.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-zinc-400">{review.body}</p>

          {review.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {review.tags.slice(0, 4).map((t) => <TagChip key={t.label} tag={t} />)}
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-5 border-t border-zinc-800 px-5 py-3">
        <LikeButton endpoint={`/reviews/${review.id}/like`} liked={review.liked_by_me} count={review.like_count} />
        <Link to={`/reviews/${review.id}#comments`} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
          <CommentIcon /> {review.comment_count}
        </Link>
      </div>
    </article>
  );
}
