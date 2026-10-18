import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { HeartIcon } from './Icons';

// Optimistic like for anything likeable. endpoint: '/reviews/:id/like' or '/posts/:id/like'.
// The heart fills instantly, then we sync with the server (and undo if it fails).
export default function LikeButton({ endpoint, liked: initialLiked, count: initialCount, onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e.preventDefault(); // the button may sit inside a clickable card
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (busy) return;

    const prev = state;
    setState({ liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) });
    setBusy(true);
    try {
      const { data } = prev.liked ? await api.delete(endpoint) : await api.post(endpoint);
      setState({ liked: data.liked_by_me, count: data.like_count });
      onChange?.(data);
    } catch {
      setState(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 text-sm transition ${state.liked ? 'text-brand-500' : 'text-zinc-400 hover:text-zinc-200'}`}
      aria-pressed={state.liked}
      aria-label={state.liked ? 'Unlike' : 'Like'}
    >
      <HeartIcon filled={state.liked} className={`size-5 ${state.liked ? 'scale-110' : ''} transition`} />
      {state.count}
    </button>
  );
}
