import { useCallback, useEffect, useState } from 'react';

export const useDiaryNavigation = (activeDayISO: string) => {
  const [expandedSlotIdx, setExpandedSlotIdx] = useState<number | null>(null);

  useEffect(() => {
    setExpandedSlotIdx(null);
  }, [activeDayISO]);

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
