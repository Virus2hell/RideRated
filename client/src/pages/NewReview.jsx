import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage, fieldErrors } from '../lib/api';
import { useRoad } from '../lib/queries';
import { RATING_CATEGORIES, SEASONS } from '../lib/constants';
import RoadPicker from '../components/review/RoadPicker';
import FormField from '../components/ui/FormField';
import StarInput from '../components/ui/StarInput';
import TagInput from '../components/ui/TagInput';

const MAX_PHOTOS = 5;

// Readable names for server validation errors, so no error is ever hidden.
const FIELD_LABELS = {
  road: 'Road', roadId: 'Road', title: 'Title', body: 'Review', ratingOverall: 'Overall rating',
  ratingSurface: 'Road surface', ratingScenery: 'Scenery', ratingTraffic: 'Traffic', ratingSafety: 'Safety',
  riddenOn: 'Ride date', bestSeason: 'Best season', tags: 'Tags',
};
const today = new Date().toISOString().slice(0, 10);

function Section({ n, title, children }) {
  return (
    <section className="card p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-3xl tracking-wide">
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 font-sans text-sm font-bold">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function NewReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const presetRoadId = params.get('roadId');
  const { data: presetRoad } = useRoad(presetRoadId);

  // undefined = rider hasn't chosen yet, so fall back to the road from ?roadId= (if any)
  const [chosenRoad, setRoad] = useState(undefined);
  const road = chosenRoad === undefined ? (presetRoad ?? null) : chosenRoad;
  const [newRoad, setNewRoad] = useState({ name: '', city: '', pincode: '', lat: null, lng: null, osmId: undefined });
  const [form, setForm] = useState({
    title: '', body: '', riddenOn: '', bestSeason: '',
    ratingOverall: null, ratingSurface: null, ratingScenery: null, ratingTraffic: null, ratingSafety: null,
    tags: [],
  });
  const [photos, setPhotos] = useState([]);
  const [localError, setLocalError] = useState('');

  // Preview URLs for selected photos (cleaned up to avoid memory leaks).
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const addPhotos = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    setPhotos((p) => [...p, ...picked].slice(0, MAX_PHOTOS));
  };

  const submit = useMutation({
    mutationFn: () => {
      const data = {
        ...(road ? { roadId: road.id } : { road: newRoad }),
        title: form.title,
        body: form.body,
        ratingOverall: form.ratingOverall,
        tags: form.tags,
      };
      // Only send optional fields that were filled in.
      for (const k of ['ratingSurface', 'ratingScenery', 'ratingTraffic', 'ratingSafety', 'riddenOn', 'bestSeason']) {
        if (form[k]) data[k] = form[k];
      }
      const body = new FormData();
      body.append('data', JSON.stringify(data));
      photos.forEach((p) => body.append('photos', p));
      return api.post('/reviews', body).then((r) => r.data);
    },
    onSuccess: ({ id }) => {
      // Everything that shows reviews or road stats is now out of date.
      ['reviews', 'roads', 'road', 'stats'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      navigate(`/reviews/${id}`);
    },
  });

  const errors = fieldErrors(submit.error);

  const onSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!road && newRoad.lat == null) return setLocalError('Pick a road or drop a pin on the map.');
    if (!form.ratingOverall) return setLocalError('Give the road an overall star rating.');
    submit.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-6xl leading-none tracking-wide">Rate a road</h1>
      <p className="mt-1 text-zinc-400">Honest reviews keep riders safe. Tell it like it is.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <Section n="1" title="Which road?">
          <RoadPicker selected={road} onSelect={setRoad} newRoad={newRoad} setNewRoad={setNewRoad} errors={errors} />
        </Section>

        <Section n="2" title="Rate it">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-zinc-950/60 p-4">
            <div>
              <p className="font-semibold">Overall <span className="text-brand-500">*</span></p>
              <p className="text-xs text-zinc-500">Would you ride it again?</p>
            </div>
            <StarInput value={form.ratingOverall} onChange={set('ratingOverall')} size="size-9" allowClear={false} />
          </div>
          {errors.ratingOverall && <p className="mt-2 text-sm text-red-400">{errors.ratingOverall[0]}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {RATING_CATEGORIES.map((c) => {
              const key = `rating${c.key[0].toUpperCase()}${c.key.slice(1)}`;
              return (
                <div key={c.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-zinc-500">{c.hint}</p>
                  </div>
                  <StarInput value={form[key]} onChange={set(key)} size="size-6" />
                </div>
              );
            })}
          </div>
        </Section>

        <Section n="3" title="Tell the story">
          <div className="space-y-4">
            <FormField label="Title" placeholder="e.g. Monsoon heaven, but watch the wet patches" value={form.title} onChange={(e) => set('title')(e.target.value)} error={errors.title?.[0]} maxLength={120} required />
            <FormField as="textarea" rows={6} label="Your review" placeholder="Road condition, best time to go, food stops, fuel, anything riders should know…" value={form.body} onChange={(e) => set('body')(e.target.value)} error={errors.body?.[0]} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField type="date" label="When did you ride it?" max={today} value={form.riddenOn} onChange={(e) => set('riddenOn')(e.target.value)} hint="Road conditions change, so dates help." />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-300">Best season to ride</span>
                <select className="input" value={form.bestSeason} onChange={(e) => set('bestSeason')(e.target.value)}>
                  <option value="">Not sure</option>
                  {Object.entries(SEASONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-300">
                Tags <span className="text-zinc-500">(up to 6 · green = good, red = warning)</span>
              </p>
              <TagInput value={form.tags} onChange={set('tags')} />
            </div>
          </div>
        </Section>

        <Section n="4" title="Photos">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-lg">
                <img src={src} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/80 text-xs" aria-label="Remove photo">✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-center text-xs text-zinc-500 hover:border-brand-500 hover:text-brand-400">
                <span><span className="block text-2xl">+</span>Add photo</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} className="hidden" />
              </label>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Up to {MAX_PHOTOS} photos, 5 MB each. The first one is the cover.</p>
        </Section>

        {(localError || submit.isError) && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <p className="font-semibold">{localError || errorMessage(submit.error)}</p>
            {!localError && Object.keys(errors).length > 0 && (
              <ul className="mt-1 list-inside list-disc">
                {Object.entries(errors).map(([field, msgs]) => (
                  <li key={field}>{FIELD_LABELS[field] ?? field}: {msgs[0]}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
          <button disabled={submit.isPending} className="btn-primary px-8 py-3 text-base">
            {submit.isPending ? 'Publishing…' : 'Publish review'}
          </button>
        </div>
      </form>
    </div>
  );
}
