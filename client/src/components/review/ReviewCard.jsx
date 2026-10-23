import { Link } from 'react-router-dom';
import { timeAgo } from '../../lib/format';
import Avatar from '../ui/Avatar';
import SafeImage from '../ui/SafeImage';
import UserLink from '../ui/UserLink';
import StarRating from '../ui/StarRating';
import TagChip from '../ui/TagChip';
import LikeButton from '../ui/LikeButton';
import { CameraIcon, CommentIcon, ImagesIcon, PinIcon } from '../ui/Icons';

const VISIBLE_TAGS = 2;

// Every card has the SAME fixed height so the grid lines up neatly:
// a short photo strip (or "No image"), then text that is cut off with "…" instead of growing the card.
// The full photos and full text are on the review page.
export default function ReviewCard({ review, showRoad = true }) {
  const cover = review.photos[0];
  const extraTags = review.tags.length - VISIBLE_TAGS;

  return (
    <article className="card group flex h-[22rem] flex-col overflow-hidden transition hover:border-zinc-700">
      <Link to={`/reviews/${review.id}`} className="flex min-h-0 flex-1 flex-col">
        {/* Photo strip: fixed 96px tall */}
        <div className="relative h-24 shrink-0 overflow-hidden bg-zinc-900">
          {cover ? (
            <>
              <SafeImage src={cover} className="size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              {review.photos.length > 1 && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs">
                  <ImagesIcon className="size-3.5" /> {review.photos.length}
                </span>
              )}
            </>
          ) : (
            <div className="flex size-full items-center justify-center gap-2 text-sm text-zinc-600">
              <CameraIcon /> No image
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="flex items-center gap-3">
            <UserLink username={review.author.username} inCard>
              <Avatar user={review.author} size="size-8" />
            </UserLink>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold">
                <UserLink username={review.author.username} inCard>{review.author.display_name}</UserLink>
              </p>
              <p className="truncate text-xs text-zinc-500">@{review.author.username} · {timeAgo(review.created_at)}</p>
            </div>
            <StarRating value={review.rating_overall} size="size-3.5" />
          </div>

          {showRoad && (
            <p className="mt-3 flex min-w-0 items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-400">
              <PinIcon className="size-3.5 shrink-0" />
              <span className="truncate">
                {review.road.name}
                {review.road.city && <span className="font-normal normal-case tracking-normal text-zinc-500"> · {review.road.city}</span>}
              </span>
            </p>
          )}
          <h3 className="mt-1 line-clamp-1 text-lg font-bold leading-snug">{review.title}</h3>
          <p className="mt-1 line-clamp-2 break-words text-sm text-zinc-400">{review.body}</p>

          {/* Tags: one row only, always at the bottom of the text area */}
          {review.tags.length > 0 && (
            <div className="mt-auto flex flex-nowrap items-center gap-1.5 overflow-hidden pt-3">
              {review.tags.slice(0, VISIBLE_TAGS).map((t) => <TagChip key={t.label} tag={t} />)}
              {extraTags > 0 && <span className="shrink-0 text-xs text-zinc-500">+{extraTags} more</span>}
            </div>
          )}
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-5 border-t border-zinc-800 px-4 py-2.5">
        <LikeButton endpoint={`/reviews/${review.id}/like`} liked={review.liked_by_me} count={review.like_count} />
        <Link to={`/reviews/${review.id}#comments`} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
          <CommentIcon /> {review.comment_count}
        </Link>
      </div>
    </article>
  );
}
