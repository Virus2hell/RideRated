// Label + input + error message, styled consistently across all forms.
export default function FormField({ label, error, hint, as = 'input', ...inputProps }) {
  const Comp = as;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>
      <Comp {...inputProps} className="input" />
      {hint && !error && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
    </label>
  );
}
