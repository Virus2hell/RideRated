import { useEffect, useState } from 'react';

// Returns `value` only after it stops changing for `delay` ms.
// Used for search boxes, so we don't send a request on every keystroke.
export default function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
