import { useEffect, useState } from 'react';

/**
 * Value-debounce hook. Returns a debounced copy of `value` that only
 * updates after `delay` ms of inactivity.
 *
 * Distinct from `useDebouncedCallback` in `utils/debounce.ts`, which
 * debounces a callback function rather than a reactive value.
 */
const useDebounce = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export { useDebounce };
