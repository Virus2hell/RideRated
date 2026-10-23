// Label + input + error message, styled consistently across all forms.
// Required fields get a red * automatically; pass optional to show "(optional)" instead.
export default function FormField({ label, error, hint, optional = false, as = 'input', ...inputProps }) {
  const Comp = as;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {inputProps.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        {optional && <span className="ml-1 font-normal text-zinc-500">(optional)</span>}
      </span>
      <Comp {...inputProps} className="input" />
      {hint && !error && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
    </label>
  );
}
