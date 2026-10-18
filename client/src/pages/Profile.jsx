import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../lib/queries';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import ReviewList from '../components/review/ReviewList';
import FollowButton from '../components/profile/FollowButton';
import SocialLinks from '../components/profile/SocialLinks';
import FollowListModal from '../components/profile/FollowListModal';
import ProfileBanner from '../components/profile/ProfileBanner';
import PostGrid from '../components/posts/PostGrid';
import { BikeIcon, CalendarIcon, EditIcon, PinIcon } from '../components/ui/Icons';
import NotFound from './NotFound';

function Stat({ value, label, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={`text-left ${onClick ? 'group' : ''}`}>
      <p className="font-display text-3xl leading-none sm:text-4xl">{value}</p>
      <p className={`text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs sm:tracking-widest ${onClick ? 'group-hover:text-brand-400' : ''}`}>{label}</p>
    </Comp>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const { data: user, isLoading, isError } = useProfile(username);
  const [tab, setTab] = useState('reviews');
  const [followers, setFollowers] = useState(null); // live count after follow/unfollow
  const [listOpen, setListOpen] = useState(null); // 'followers' | 'following'

  if (isLoading) return <Spinner />;
  if (isError || !user) return <NotFound />;

  const isMe = me?.username === user.username;
  const followerCount = followers ?? user.follower_count;

  return (
    <div>
      <ProfileBanner user={user} isMe={isMe} />

      <div className="mx-auto max-w-6xl px-4">
        <div className="relative z-10 -mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">
          <div className="w-fit rounded-full border-4 border-asphalt">
            <Avatar user={user} size="size-32 sm:size-40 text-3xl" />
          </div>
          <div className="flex-1 sm:pb-2">
            <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">{user.display_name}</h1>
            <p className="text-zinc-400">@{user.username}</p>
          </div>
          <div className="flex gap-2 sm:pb-3">
            {isMe ? (
              <Link to="/settings/profile" className="btn-ghost"><EditIcon /> Edit profile</Link>
            ) : (
              <FollowButton key={user.id} username={user.username} isFollowing={user.is_following} onChange={(d) => setFollowers(d.follower_count)} />
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            {user.bio && <p className="max-w-2xl whitespace-pre-line text-lg text-zinc-200">{user.bio}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-400">
              {user.city && <span className="flex items-center gap-1.5"><PinIcon /> {user.city}</span>}
              {user.riding_since && <span className="flex items-center gap-1.5"><BikeIcon className="size-4" /> Riding since {user.riding_since}</span>}
              <span className="flex items-center gap-1.5">
                <CalendarIcon /> Joined {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <SocialLinks user={user} />
            {isMe && !user.instagram_url && !user.youtube_url && (
              <Link to="/settings/profile" className="inline-block text-sm text-brand-400 hover:underline">
                + Add your Instagram or YouTube so riders can follow you there
              </Link>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 self-start rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 sm:flex sm:gap-8 sm:px-6">
            <Stat value={user.review_count} label="Reviews" onClick={() => setTab('reviews')} />
            <Stat value={user.post_count} label="Posts" onClick={() => setTab('posts')} />
            <Stat value={followerCount} label="Followers" onClick={() => setListOpen('followers')} />
            <Stat value={user.following_count} label="Following" onClick={() => setListOpen('following')} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex gap-6 border-b border-zinc-800">
          {[['reviews', `Reviews (${user.review_count})`], ['posts', `Posts (${user.post_count})`]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 pb-3 font-display text-2xl tracking-wide transition ${
                tab === key ? 'border-brand-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === 'reviews' ? (
            <ReviewList
              filters={{ username: user.username }}
              columns="sm:grid-cols-2 lg:grid-cols-3"
              empty={isMe ? "You haven't rated any roads yet. Your first review is one ride away!" : 'No reviews yet.'}
            />
          ) : (
            <PostGrid username={user.username} isMe={isMe} />
          )}
        </div>
      </div>

      {listOpen && <FollowListModal username={user.username} type={listOpen} onClose={() => setListOpen(null)} />}
    </div>
  );
}
