import { useCallback, useEffect, useState } from 'react';

export const useDiaryNavigation = (activeDayISO: string) => {
  const [expandedSlotIdx, setExpandedSlotIdx] = useState<number | null>(null);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    setExpandedSlotIdx(null);
  }, [activeDayISO]);

  const expandSlot = useCallback((idx: number) => {
    setExpandedSlotIdx(idx);
    setHasShownPrompt(true);
  }, []);

  const collapseSlot = useCallback(() => {
    setExpandedSlotIdx(null);
  }, []);

  const markPromptShown = useCallback(() => {
    setHasShownPrompt(true);
  }, []);

  return {
    expandedSlotIdx,
    expandSlot,
    collapseSlot,
    hasShownPrompt,
    markPromptShown
  };
};
