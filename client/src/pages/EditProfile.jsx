import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage, fieldErrors, mediaUrl } from '../lib/api';
import { compressImage } from '../lib/compressImage';
import Avatar from '../components/ui/Avatar';
import FormField from '../components/ui/FormField';
import { CameraIcon, InstagramIcon, YouTubeIcon } from '../components/ui/Icons';

const THIS_YEAR = new Date().getFullYear();

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    displayName: user.display_name ?? '',
    bio: user.bio ?? '',
    city: user.city ?? '',
    ridingSince: user.riding_since ?? '',
    instagramUrl: user.instagram_url ?? '',
    youtubeUrl: user.youtube_url ?? '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : null), [avatarFile]);
  useEffect(() => () => avatarPreview && URL.revokeObjectURL(avatarPreview), [avatarPreview]);
  const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : null), [bannerFile]);
  useEffect(() => () => bannerPreview && URL.revokeObjectURL(bannerPreview), [bannerPreview]);

  // Profile changes show up on reviews, comments and the profile page, so refresh those.
  const refresh = (updated) => {
    setUser(updated);
    queryClient.invalidateQueries({ queryKey: ['profile', updated.username] });
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
  };

  const save = useMutation({
    mutationFn: async () => {
      let updated = (await api.patch('/users/me', form)).data.user;
      // upload any new images after the text fields are saved
      for (const [field, file] of [['avatar', avatarFile], ['banner', bannerFile]]) {
        if (!file) continue;
        const body = new FormData();
        body.append(field, await compressImage(file, { maxSide: field === 'avatar' ? 512 : 1920 }));
        updated = (await api.post(`/users/me/${field}`, body)).data.user;
      }
      return updated;
    },
    onSuccess: (updated) => {
      refresh(updated);
      navigate(`/u/${updated.username}`);
    },
  });

  const removeImage = useMutation({
    mutationFn: (field) => api.delete(`/users/me/${field}`).then((r) => r.data.user),
    onSuccess: (updated, field) => {
      if (field === 'avatar') setAvatarFile(null);
      else setBannerFile(null);
      refresh(updated);
    },
  });
  const bannerSrc = bannerPreview ?? (user.banner_url ? mediaUrl(user.banner_url) : null);

  const errors = fieldErrors(save.error);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const shownUser = avatarPreview ? { ...user, avatar_url: avatarPreview } : user;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-6xl leading-none tracking-wide">Edit profile</h1>
      <p className="mt-1 text-zinc-400">Let other riders know who's behind the visor.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-8 space-y-6"
      >
        <section className="card overflow-hidden">
          <div className="relative h-36 bg-gradient-to-br from-brand-700 via-orange-900 to-zinc-950 sm:h-44">
            {bannerSrc ? (
              <img src={bannerSrc} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-x-0 bottom-8 road-divider opacity-50" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <label className="btn-ghost cursor-pointer">
              <CameraIcon /> {user.banner_url || bannerFile ? 'Change banner' : 'Upload banner'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setBannerFile(e.target.files[0] ?? null)} />
            </label>
            {user.banner_url && !bannerFile && (
              <button type="button" onClick={() => removeImage.mutate('banner')} className="text-sm text-zinc-500 hover:text-red-400">
                Remove banner
              </button>
            )}
            <p className="text-xs text-zinc-500">Wide photos look best (about 1500 × 500).</p>
          </div>
        </section>

        <section className="card flex flex-wrap items-center gap-6 p-6">
          <Avatar user={shownUser} size="size-24 text-2xl" />
          <div className="space-y-2">
            <label className="btn-ghost cursor-pointer">
              <CameraIcon /> {user.avatar_url || avatarFile ? 'Change photo' : 'Upload photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setAvatarFile(e.target.files[0] ?? null)} />
            </label>
            {user.avatar_url && !avatarFile && (
              <button type="button" onClick={() => removeImage.mutate('avatar')} className="block text-sm text-zinc-500 hover:text-red-400">
                Remove photo
              </button>
            )}
            <p className="text-xs text-zinc-500">JPG, PNG or WEBP, up to 5 MB. Saved when you click Save.</p>
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <FormField label="Name" name="displayName" value={form.displayName} onChange={update} error={errors.displayName?.[0]} maxLength={60} required />
          <FormField as="textarea" rows={3} label="Bio" name="bio" placeholder="Weekend ghat rider. Coffee stops > top speed." value={form.bio} onChange={update} error={errors.bio?.[0]} maxLength={300} hint={`${form.bio.length}/300`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="City" name="city" placeholder="Pune" value={form.city} onChange={update} error={errors.city?.[0]} />
            <FormField label="Riding since" name="ridingSince" type="number" min="1950" max={THIS_YEAR} placeholder="2018" value={form.ridingSince} onChange={update} error={errors.ridingSince?.[0]} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <div>
            <h2 className="font-display text-3xl tracking-wide">Promote your channels</h2>
            <p className="text-sm text-zinc-400">Shown as big buttons on your profile, so riders can follow you there too.</p>
          </div>
          <div className="flex items-start gap-3">
            <InstagramIcon className="mt-8 size-6 shrink-0 text-pink-500" />
            <div className="flex-1">
              <FormField label="Instagram" name="instagramUrl" placeholder="instagram.com/your.handle" value={form.instagramUrl} onChange={update} error={errors.instagramUrl?.[0]} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <YouTubeIcon className="mt-8 size-6 shrink-0 text-red-500" />
            <div className="flex-1">
              <FormField label="YouTube" name="youtubeUrl" placeholder="youtube.com/@yourchannel" value={form.youtubeUrl} onChange={update} error={errors.youtubeUrl?.[0]} />
            </div>
          </div>
        </section>

        {save.isError && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {Object.keys(errors).length ? 'Please fix the highlighted fields.' : errorMessage(save.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Link to={`/u/${user.username}`} className="btn-ghost">Cancel</Link>
          <button disabled={save.isPending} className="btn-primary px-8 py-3 text-base">
            {save.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
