/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef } from 'react';

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

export default useDebouncedCallback;
