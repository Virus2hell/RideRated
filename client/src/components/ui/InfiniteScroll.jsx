import { useEffect, useRef } from 'react';

// Put this under a list. When it scrolls into view (or 600px before), it loads the next page.
// Uses IntersectionObserver: the browser tells us when the element is visible, no scroll listeners.
export default function InfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, endMessage }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '600px' }, // start loading before the rider actually reaches the bottom
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={ref} className="flex min-h-16 items-center justify-center py-8 text-sm text-zinc-500">
      {isFetchingNextPage ? (
        <span className="flex items-center gap-3">
          <span className="size-5 animate-spin rounded-full border-2 border-zinc-700 border-t-brand-500" /> Loading more…
        </span>
      ) : (
        !hasNextPage && endMessage && <span className="flex items-center gap-3"><span className="h-px w-10 bg-zinc-800" />{endMessage}<span className="h-px w-10 bg-zinc-800" /></span>
      )}
    </div>
  );
}
