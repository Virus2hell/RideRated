import { Link } from 'react-router-dom';
import { useFollowList } from '../../lib/queries';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import FollowButton from './FollowButton';

// type: 'followers' | 'following'
export default function FollowListModal({ username, type, onClose }) {
  const { data: users = [], isLoading } = useFollowList(username, type);

  return (
    <Modal title={type === 'followers' ? 'Followers' : 'Following'} onClose={onClose}>
      {isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <p className="py-6 text-center text-zinc-400">{type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>
      ) : (
        <ul className="-mx-2 max-h-[60vh] space-y-1 overflow-y-auto">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800/60">
              <Link to={`/u/${u.username}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar user={u} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.display_name}</p>
                  <p className="truncate text-xs text-zinc-500">@{u.username}{u.city && ` · ${u.city}`}</p>
                </div>
              </Link>
              <FollowButton username={u.username} isFollowing={u.is_following} size="py-1 text-xs" />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
