// A review tag: { label, tone }. Green = good, red = warning.
// Pass onClick to make it a toggle (selected styles it), or onRemove to show an ✕.
export default function TagChip({ tag, selected = true, onClick, onRemove }) {
  const bad = tag.tone === 'bad';
  const tone = !selected
    ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
    : bad
      ? 'border-red-500/50 bg-red-500/10 text-red-300'
      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
  const Comp = onClick ? 'button' : 'span';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      <span className={`size-1.5 rounded-full ${bad ? 'bg-red-400' : 'bg-emerald-400'}`} />
      {tag.label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="-mr-1 ml-0.5 opacity-60 hover:opacity-100" aria-label={`Remove ${tag.label}`}>
          ✕
        </button>
      )}
    </Comp>
  );
}
