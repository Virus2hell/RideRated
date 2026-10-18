import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api, errorMessage } from '../../lib/api';
import Modal from '../ui/Modal';
import { CameraIcon } from '../ui/Icons';

const MAX_PHOTOS = 5;
const MAX_CAPTION = 1000;

export default function NewPostModal({ onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState('');

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const share = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.append('caption', caption);
      photos.forEach((p) => body.append('photos', p));
      return api.post('/posts', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user.username] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
      onClose();
    },
  });

  const addPhotos = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    setPhotos((p) => [...p, ...picked].slice(0, MAX_PHOTOS));
  };

  return (
    <Modal title="New post" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          share.mutate();
        }}
        className="space-y-4"
      >
        {photos.length === 0 ? (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-brand-500 hover:text-brand-400">
            <span className="flex flex-col items-center gap-2 text-sm">
              <CameraIcon className="size-10" />
              Choose up to {MAX_PHOTOS} photos
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
          </label>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-lg">
                <img src={src} alt="" className="size-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[10px] font-semibold">COVER</span>}
                <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/80 text-xs" aria-label="Remove photo">✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-2xl text-zinc-500 hover:border-brand-500">
                +
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
              </label>
            )}
          </div>
        )}

        <div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={MAX_CAPTION}
            rows={3}
            placeholder="Write a caption… where did you ride?"
            className="input"
          />
          <p className="mt-1 text-right text-xs text-zinc-500">{caption.length}/{MAX_CAPTION}</p>
        </div>

        {share.isError && <p className="text-sm text-red-400">{errorMessage(share.error)}</p>}
        <button disabled={share.isPending || photos.length === 0} className="btn-primary w-full py-3">
          {share.isPending ? 'Sharing…' : 'Share post'}
        </button>
      </form>
    </Modal>
  );
}
