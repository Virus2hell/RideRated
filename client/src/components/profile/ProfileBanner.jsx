import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api, errorMessage, mediaUrl } from '../../lib/api';
import { CameraIcon } from '../ui/Icons';

// Banner image across the top of a profile (like LinkedIn / YouTube).
// No banner yet → the orange RideRated road design. The owner gets a "Change banner" button.
export default function ProfileBanner({ user, isMe }) {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: (file) => {
      const body = new FormData();
      body.append('banner', file);
      return api.post('/users/me/banner', body).then((r) => r.data.user);
    },
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ['profile', updated.username] });
    },
  });

  return (
    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-700 via-orange-900 to-zinc-950 sm:h-56 lg:h-64">
      {user.banner_url ? (
        <img src={mediaUrl(user.banner_url)} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-x-0 bottom-10 road-divider opacity-50" />
      )}
      {/* darken the bottom so the avatar and name stay readable on bright photos */}
      <div className="absolute inset-0 bg-gradient-to-t from-asphalt/70 via-transparent to-transparent" />

      {isMe && (
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
          <label className="btn cursor-pointer bg-black/60 text-white backdrop-blur hover:bg-black/80">
            <CameraIcon /> {upload.isPending ? 'Uploading…' : user.banner_url ? 'Change banner' : 'Add banner'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={upload.isPending}
              onChange={(e) => {
                const file = e.target.files[0];
                e.target.value = '';
                if (file) upload.mutate(file);
              }}
            />
          </label>
          {upload.isError && <span className="rounded bg-black/70 px-2 py-1 text-xs text-red-300">{errorMessage(upload.error)}</span>}
        </div>
      )}
    </div>
  );
}
