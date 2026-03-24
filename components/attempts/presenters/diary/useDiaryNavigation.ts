import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, type TextInput as RNTextInput } from 'react-native';
import { FIELD_NAMES, FIELDS_PER_SLOT } from '@/utils/activityHelpers';

// Estimated height of a single slot card (Card.Title + 5 fields + spacing).
// Used by getItemLayout for fast FlatList scrollToIndex without measurement.
const SLOT_CARD_HEIGHT = 370;

type DayRow = { key: string; value: { label: string } };

// Pure function — no need for useCallback
export const refKey = (slotIdx: number, fieldIdx: number): string => `${slotIdx}-${fieldIdx}`;

export const useDiaryNavigation = (dayRows: DayRow[], activeDayISO: string) => {
  const flatListRef = useRef<FlatList>(null);
  const inputRefs = useRef<Map<string, RNTextInput>>(new Map());
  const [focusedFieldIdx, setFocusedFieldIdx] = useState<number | null>(null);

  // Reset toolbar state when keyboard is dismissed via OS gesture
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => setFocusedFieldIdx(null));
    return () => sub.remove();
  }, []);

  // Clear stale refs and reset toolbar when switching days
  useEffect(() => {
    inputRefs.current.clear();
    setFocusedFieldIdx(null);
  }, [activeDayISO]);

  const totalFields = dayRows.length * FIELDS_PER_SLOT;

  const registerRef = useCallback((key: string, ref: RNTextInput | null) => {
    if (ref) {
      inputRefs.current.set(key, ref);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  // Stable ref callback cache — avoids recreating arrow functions on every render
  const refCallbackCache = useRef<Map<string, (r: RNTextInput | null) => void>>(new Map());
  const getRefCallback = useCallback(
    (key: string) => {
      if (!refCallbackCache.current.has(key)) {
        refCallbackCache.current.set(key, (r: RNTextInput | null) => registerRef(key, r));
      }
      return refCallbackCache.current.get(key)!;
    },
    [registerRef]
  );

  // Focus a field by flat index — scroll first so virtualised items mount before focus
  const focusField = useCallback(
    (flatIdx: number) => {
      const slotIdx = Math.floor(flatIdx / FIELDS_PER_SLOT);
      const fieldIdx = flatIdx % FIELDS_PER_SLOT;
      const key = refKey(slotIdx, fieldIdx);

      const tryFocus = () => {
        const input = inputRefs.current.get(key);
        input?.focus();
      };

      if (flatListRef.current && slotIdx < dayRows.length) {
        flatListRef.current.scrollToIndex({ index: slotIdx, animated: true, viewPosition: 0.3 });
        requestAnimationFrame(tryFocus);
      } else {
        tryFocus();
      }
    },
    [dayRows.length]
  );

  const toolbarLabel = useMemo(() => {
    if (focusedFieldIdx == null) return '';
    const slotIdx = Math.floor(focusedFieldIdx / FIELDS_PER_SLOT);
    const fieldIdx = focusedFieldIdx % FIELDS_PER_SLOT;
    const slotLbl = dayRows[slotIdx]?.value.label ?? '';
    return `${FIELD_NAMES[fieldIdx]} — ${slotLbl}`;
  }, [focusedFieldIdx, dayRows]);

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: SLOT_CARD_HEIGHT,
      offset: SLOT_CARD_HEIGHT * index,
      index
    }),
    []
  );

  return {
    flatListRef,
    focusedFieldIdx,
    setFocusedFieldIdx,
    totalFields,
    getRefCallback,
    focusField,
    toolbarLabel,
    getItemLayout
  };
};
