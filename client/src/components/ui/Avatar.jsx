import { mediaUrl } from '../../lib/api';

// Profile photo, or the rider's initials on an orange background.
// size can include a text size for the initials, e.g. "size-24 text-2xl".
export default function Avatar({ user, size = 'size-9' }) {
  if (user?.avatar_url) {
    return <img src={mediaUrl(user.avatar_url)} alt="" className={`${size} rounded-full object-cover`} />;
  }
  const initials = (user?.display_name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className={`${size} ${size.includes('text-') ? '' : 'text-xs'} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold`}>
      {initials}
    </span>
  );
}
