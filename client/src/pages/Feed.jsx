import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewList from '../components/review/ReviewList';
import { PlusIcon } from '../components/ui/Icons';

export default function Feed() {
  const { user } = useAuth();
  const [feed, setFeed] = useState('all');
  const active = user ? feed : 'all';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl leading-none tracking-wide">Review feed</h1>
          <p className="mt-1 text-zinc-400">The latest road reviews from the community.</p>
        </div>
        {user && (
          <Link to="/reviews/new" className="btn-primary shrink-0">
            <PlusIcon /> Rate a road
          </Link>
        )}
      </div>

      {user && (
        <div className="mb-6 inline-flex rounded-lg border border-zinc-800 p-1">
          {[['all', 'Everyone'], ['following', 'Following']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFeed(key)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${active === key ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ReviewList
        key={active}
        filters={{ feed: active }}
        columns="grid-cols-1"
        empty={
          active === 'following'
            ? "No reviews from riders you follow yet. Use Search riders to find people to follow."
            : 'No reviews yet. Be the first to rate a road!'
        }
      />
    </div>
  );
}
