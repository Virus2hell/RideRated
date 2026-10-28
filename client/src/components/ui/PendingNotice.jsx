import { useEffect, useState } from 'react';

// "Please wait…" banner shown while a slow request runs.
// After `slowAfter` ms it explains why: the free server may be waking up (it sleeps when idle).
export default function PendingNotice({ message, slowAfter = 5000 }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), slowAfter);
    return () => clearTimeout(t);
  }, [slowAfter]);

  return (
    <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-lg border border-brand-600/40 bg-brand-600/10 p-3 text-sm">
      <span className="mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2 border-brand-600/40 border-t-brand-500" />
      <div>
        <p className="font-semibold text-brand-300">{message}</p>
        {slow && (
          <p className="mt-0.5 text-zinc-400">
            The server is waking up, which can take up to a minute. Please don't close or refresh this page.
          </p>
        )}
      </div>
    </div>
  );
}