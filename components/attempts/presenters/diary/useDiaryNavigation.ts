import { useCallback, useState } from 'react';

export const useDiaryNavigation = (activeDayISO: string) => {
  const [expandedSlotIdx, setExpandedSlotIdx] = useState<number | null>(null);

  // Collapse any expanded slot when the active day changes. Adjusting during
  // render is React's recommended alternative to a sync effect.
  const [prevDayISO, setPrevDayISO] = useState(activeDayISO);
  if (prevDayISO !== activeDayISO) {
    setPrevDayISO(activeDayISO);
    setExpandedSlotIdx(null);
  }

  const expandSlot = useCallback((idx: number) => {
    setExpandedSlotIdx(idx);
  }, []);

  const collapseSlot = useCallback(() => {
    setExpandedSlotIdx(null);
  }, []);

  return {
    expandedSlotIdx,
    expandSlot,
    collapseSlot
  };
};
