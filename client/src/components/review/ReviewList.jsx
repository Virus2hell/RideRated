import { useReviews } from '../../lib/queries';
import ReviewCard from './ReviewCard';
import Spinner from '../ui/Spinner';

// Infinite list of reviews with a "Load more" button (cursor pagination from the API).
export default function ReviewList({ filters, showRoad = true, empty = 'No reviews yet.', columns = 'sm:grid-cols-2' }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviews(filters);

  if (isLoading) return <Spinner label="Loading reviews…" />;
  if (isError) return <p className="py-8 text-center text-red-400">Couldn't load reviews.</p>;

  const reviews = data.pages.flatMap((p) => p.reviews);
  if (!reviews.length) return <p className="card p-8 text-center text-zinc-400">{empty}</p>;

  return (
    <div>
      <div className={`grid gap-5 ${columns}`}>
        {reviews.map((r) => <ReviewCard key={r.id} review={r} showRoad={showRoad} />)}
      </div>
      {hasNextPage && (
        <div className="mt-8 text-center">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-ghost">
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
