import { act, renderHook } from '@testing-library/react-native';

import useDebouncedCallback from './debounce';

describe('useDebouncedCallback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls the callback after the delay', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 300));

    act(() => result.current('hello'));
    expect(cb).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(300));
    expect(cb).toHaveBeenCalledWith('hello');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on rapid calls (debounce behaviour)', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 200));

    act(() => result.current('a'));
    act(() => jest.advanceTimersByTime(100));
    act(() => result.current('b'));
    act(() => jest.advanceTimersByTime(200));

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('b');
  });

  it('still fires after unmount (does not clear on unmount by design)', () => {
    const cb = jest.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(cb, 300));

    act(() => result.current());
    unmount();
    act(() => jest.advanceTimersByTime(300));

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('passes multiple arguments through to the callback', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 100));

    act(() => result.current('arg1', 42));
    act(() => jest.advanceTimersByTime(100));

    expect(cb).toHaveBeenCalledWith('arg1', 42);
  });
});
