import { Keyboard } from 'react-native';
import { FIELDS_PER_SLOT } from '@/utils/activityHelpers';
import { act, renderHook } from '@testing-library/react-native';

import { refKey, useDiaryNavigation } from './useDiaryNavigation';

// --- Mocks ---

jest.mock('react-native', () => {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    FlatList: jest.fn(),
    Keyboard: {
      addListener: jest.fn((event: string, cb: () => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
        return {
          remove: jest.fn(() => {
            listeners[event] = listeners[event].filter((l) => l !== cb);
          })
        };
      }),
      // Helper to simulate keyboard events in tests
      __emit: (event: string) => listeners[event]?.forEach((cb) => cb())
    }
  };
});

// --- Helpers ---

const makeDayRows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    key: `2025-01-06|${String(i).padStart(2, '0')}:00`,
    value: { label: `${String(8 + i * 3).padStart(2, '0')}:00–${String(11 + i * 3).padStart(2, '0')}:00` }
  }));

describe('refKey', () => {
  it('creates a string key from slot and field indices', () => {
    expect(refKey(2, 3)).toBe('2-3');
    expect(refKey(0, 0)).toBe('0-0');
  });
});

describe('useDiaryNavigation', () => {
  const dayRows = makeDayRows(4);
  const activeDayISO = '2025-01-06';

  beforeEach(() => jest.clearAllMocks());

  it('initializes with null focused field and correct total fields', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    expect(result.current.focusedFieldIdx).toBeNull();
    expect(result.current.totalFields).toBe(dayRows.length * FIELDS_PER_SLOT);
  });

  it('getRefCallback returns stable callbacks for the same key', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    const cb1 = result.current.getRefCallback('0-0');
    const cb2 = result.current.getRefCallback('0-0');

    expect(cb1).toBe(cb2);
  });

  it('getRefCallback returns different callbacks for different keys', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    const cb1 = result.current.getRefCallback('0-0');
    const cb2 = result.current.getRefCallback('1-0');

    expect(cb1).not.toBe(cb2);
  });

  it('toolbarLabel returns empty string when no field is focused', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    expect(result.current.toolbarLabel).toBe('');
  });

  it('toolbarLabel derives label from focused field index', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    // Focus the first field of the first slot (Activity — slot 0, field 0)
    act(() => {
      result.current.setFocusedFieldIdx(0);
    });

    expect(result.current.toolbarLabel).toContain('Activity');
    expect(result.current.toolbarLabel).toContain(dayRows[0].value.label);
  });

  it('toolbarLabel works for fields in later slots', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    // Focus first field of second slot (index = FIELDS_PER_SLOT)
    act(() => {
      result.current.setFocusedFieldIdx(FIELDS_PER_SLOT);
    });

    expect(result.current.toolbarLabel).toContain('Activity');
    expect(result.current.toolbarLabel).toContain(dayRows[1].value.label);
  });

  it('resets focusedFieldIdx when keyboard hides', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    act(() => {
      result.current.setFocusedFieldIdx(2);
    });
    expect(result.current.focusedFieldIdx).toBe(2);

    // Simulate keyboard dismiss
    act(() => {
      (Keyboard as unknown as { __emit: (e: string) => void }).__emit('keyboardDidHide');
    });

    expect(result.current.focusedFieldIdx).toBeNull();
  });

  it('resets focusedFieldIdx when activeDayISO changes', () => {
    let iso = '2025-01-06';
    const { result, rerender } = renderHook(() => useDiaryNavigation(dayRows, iso));

    act(() => {
      result.current.setFocusedFieldIdx(3);
    });
    expect(result.current.focusedFieldIdx).toBe(3);

    iso = '2025-01-07';
    rerender(undefined);

    expect(result.current.focusedFieldIdx).toBeNull();
  });

  it('getItemLayout returns consistent offset/length for any index', () => {
    const { result } = renderHook(() => useDiaryNavigation(dayRows, activeDayISO));

    const layout0 = result.current.getItemLayout(null, 0);
    const layout1 = result.current.getItemLayout(null, 1);

    expect(layout0.index).toBe(0);
    expect(layout0.offset).toBe(0);
    expect(layout0.length).toBeGreaterThan(0);

    expect(layout1.index).toBe(1);
    expect(layout1.offset).toBe(layout0.length);
    expect(layout1.length).toBe(layout0.length);
  });
});
