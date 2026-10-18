import { useState } from 'react';
import { MAX_TAG_LENGTH, MAX_TAGS, TAG_SUGGESTIONS } from '../../lib/constants';
import TagChip from './TagChip';

// Write your own tags and mark each one green (good) or red (warning), or tap a suggestion.
export default function TagInput({ value, onChange }) {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('good');
  const [error, setError] = useState('');

  const has = (label) => value.some((t) => t.label.toLowerCase() === label.toLowerCase());
  const full = value.length >= MAX_TAGS;

  const add = (tag) => {
    const label = tag.label.trim().replace(/\s+/g, ' ');
    if (label.length < 2) return setError('Tags need at least 2 characters');
    if (!/^[\p{L}\p{N} &'-]+$/u.test(label)) return setError("Only letters, numbers, spaces, & - '");
    if (has(label)) return setError('You already added that tag');
    if (full) return setError(`Up to ${MAX_TAGS} tags`);
    onChange([...value, { label, tone: tag.tone }]);
    setText('');
    setError('');
  };

  const remove = (label) => onChange(value.filter((t) => t.label !== label));

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((t) => <TagChip key={t.label} tag={t} onRemove={() => remove(t.label)} />)}
        </div>
      )}

      {!full && (
        <div className="flex flex-wrap items-stretch gap-2">
          <div className="relative min-w-48 flex-1">
            <input
              value={text}
              maxLength={MAX_TAG_LENGTH}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // don't submit the whole review
                  add({ label: text, tone });
                }
              }}
              placeholder="Write a tag, e.g. Speed breakers"
              className="input pr-14"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {text.length}/{MAX_TAG_LENGTH}
            </span>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700" role="radiogroup" aria-label="Tag colour">
            <button type="button" role="radio" aria-checked={tone === 'good'} onClick={() => setTone('good')}
              className={`px-3 text-sm font-semibold ${tone === 'good' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              Good
            </button>
            <button type="button" role="radio" aria-checked={tone === 'bad'} onClick={() => setTone('bad')}
              className={`px-3 text-sm font-semibold ${tone === 'bad' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              Warning
            </button>
          </div>
          <button type="button" onClick={() => add({ label: text, tone })} disabled={!text.trim()} className="btn-ghost">
            Add
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <p className="mb-1.5 text-xs text-zinc-500">{full ? `Maximum ${MAX_TAGS} tags reached.` : 'Suggestions:'}</p>
        {!full && (
          <div className="flex flex-wrap gap-1.5">
            {TAG_SUGGESTIONS.filter((t) => !has(t.label)).map((t) => (
              <TagChip key={t.label} tag={t} selected={false} onClick={() => add(t)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
