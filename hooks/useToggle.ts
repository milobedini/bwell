import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

/**
 * This is state manager for the often used toggle scenario,
 * when we need to manage a "boolean" value and toggle it.
 */

/** Type defs. */
type ToggleReturnType = [boolean, () => void, Dispatch<SetStateAction<boolean>>];

/** Main function. */
function useToggle(initialValue: boolean | undefined = false): ToggleReturnType {
  const [value, setValue] = useState(!!initialValue);
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  // CASE: If "value" should be updated from outside the component,
  //  for example: synced up with higher-order state manager.
  useEffect(() => setValue(!!initialValue), [initialValue]);

  return [value, toggle, setValue];
}

/** Exports. */
export default useToggle;
