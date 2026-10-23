import { useReviews } from '../../lib/queries';
import ReviewCard from './ReviewCard';
import Spinner from '../ui/Spinner';
import InfiniteScroll from '../ui/InfiniteScroll';

// Reviews in a grid (3 per row on wide screens). More load automatically as you scroll.
export default function ReviewList({
  filters,
  showRoad = true,
  empty = 'No reviews yet.',
  columns = 'sm:grid-cols-2 lg:grid-cols-3',
  limit = 12, // 12 = 4 full rows of 3
  infinite = true, // false = show just the first page (e.g. the home page preview)
}) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviews(filters, limit);

  if (isLoading) return <Spinner label="Loading reviews…" />;
  if (isError) return <p className="py-8 text-center text-red-400">Couldn't load reviews.</p>;

  const reviews = data.pages.flatMap((p) => p.reviews);
  if (!reviews.length) return <p className="card p-8 text-center text-zinc-400">{empty}</p>;

  return (
    <div>
      <div className={`grid gap-5 ${columns}`}>
        {reviews.map((r) => <ReviewCard key={r.id} review={r} showRoad={showRoad} />)}
      </div>
      {infinite && (
        <InfiniteScroll
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          endMessage={data.pages.length > 1 ? "You're all caught up" : null}
        />
      )}
    </div>
  );
}
