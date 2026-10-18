import { InstagramIcon, YouTubeIcon } from '../ui/Icons';

// "instagram.com/atharva.rides" → "@atharva.rides"
function handle(url) {
  try {
    const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
    return path ? `@${path.replace(/^@/, '').split('/')[0]}` : null;
  } catch {
    return null;
  }
}

export default function SocialLinks({ user }) {
  if (!user.instagram_url && !user.youtube_url) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {user.instagram_url && (
        <a
          href={user.instagram_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn bg-gradient-to-r from-fuchsia-600 via-pink-600 to-orange-500 text-white hover:opacity-90"
        >
          <InstagramIcon /> {handle(user.instagram_url) ?? 'Instagram'}
        </a>
      )}
      {user.youtube_url && (
        <a
          href={user.youtube_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn bg-red-600 text-white hover:bg-red-500"
        >
          <YouTubeIcon /> YouTube channel
        </a>
      )}
    </div>
  );
}
