import { act, renderHook } from '@testing-library/react-native';

import { useDiaryNavigation } from './useDiaryNavigation';

describe('useDiaryNavigation', () => {
  it('initialises with no slot expanded', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    expect(result.current.expandedSlotIdx).toBeNull();
  });

  it('expands a slot', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    act(() => result.current.expandSlot(3));
    expect(result.current.expandedSlotIdx).toBe(3);
  });

  it('collapses the expanded slot', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    act(() => result.current.expandSlot(3));
    act(() => result.current.collapseSlot());
    expect(result.current.expandedSlotIdx).toBeNull();
  });

  it('switching to a different slot collapses the current one', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    act(() => result.current.expandSlot(3));
    act(() => result.current.expandSlot(5));
    expect(result.current.expandedSlotIdx).toBe(5);
  });

  it('resets expanded slot when activeDayISO changes', () => {
    const { result, rerender } = renderHook(({ iso }: { iso: string }) => useDiaryNavigation(iso), {
      initialProps: { iso: '2025-01-06' }
    });
    act(() => result.current.expandSlot(3));
    expect(result.current.expandedSlotIdx).toBe(3);
    rerender({ iso: '2025-01-07' });
    expect(result.current.expandedSlotIdx).toBeNull();
  });
});
