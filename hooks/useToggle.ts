import { Dispatch, SetStateAction, useCallback, useState } from 'react';

type ToggleReturnType = [boolean, () => void, Dispatch<SetStateAction<boolean>>];

/**
 * Boolean toggle hook. `initialValue` is only read on mount — later changes
 * are ignored. If a caller needs to re-sync from an outside source, use the
 * returned `setValue`, or remount the consumer with `key`.
 */
function useToggle(initialValue: boolean | undefined = false): ToggleReturnType {
  const [value, setValue] = useState(!!initialValue);
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  return [value, toggle, setValue];
}

export default useToggle;
