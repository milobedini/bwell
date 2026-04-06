import { act, renderHook } from '@testing-library/react-native';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update until the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 300), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe('a');
  });

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 300), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('b');
  });

  it('resets the timer on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 300), {
      initialProps: { value: 'a' }
    });

    rerender({ value: 'b' });
    act(() => jest.advanceTimersByTime(200));
    rerender({ value: 'c' });
    act(() => jest.advanceTimersByTime(200));

    // 'b' should have been skipped
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe('c');
  });

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(({ value }: { value: number }) => useDebounce(value, 200), {
      initialProps: { value: 0 }
    });

    rerender({ value: 42 });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe(42);
  });
});
