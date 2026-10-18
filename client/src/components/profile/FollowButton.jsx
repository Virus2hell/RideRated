import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

// Optimistic follow / unfollow, same pattern as the like button.
export default function FollowButton({ username, isFollowing, onChange, size = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(isFollowing);
  const [busy, setBusy] = useState(false);

  if (user?.username === username) return null;

  const toggle = async () => {
    if (!user) return navigate('/login');
    if (busy) return;
    const prev = following;
    setFollowing(!prev);
    setBusy(true);
    try {
      const { data } = prev
        ? await api.delete(`/users/${username}/follow`)
        : await api.post(`/users/${username}/follow`);
      setFollowing(data.is_following);
      onChange?.(data);
      // follower counts and the Following feed changed
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['users'] }); // rider search follower counts
      queryClient.invalidateQueries({ queryKey: ['reviews', { feed: 'following' }] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
    } catch {
      setFollowing(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={toggle} className={`${following ? 'btn-ghost' : 'btn-primary'} ${size}`} aria-pressed={following}>
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
