/**
 * Generic debounce hook. Returns `value` delayed by `delayMs` (default 300ms, Q4=A) so the
 * inventory search issues one query after the user pauses typing (BL-W4/BR-W6).
 */
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
