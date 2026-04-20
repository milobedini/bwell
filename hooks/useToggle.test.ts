import { act, renderHook } from '@testing-library/react-native';

import useToggle from './useToggle';

describe('useToggle', () => {
  it('defaults to false when no initial value provided', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('respects the initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('coerces undefined to false', () => {
    const { result } = renderHook(() => useToggle(undefined));
    expect(result.current[0]).toBe(false);
  });

  it('toggles the value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('allows direct setValue', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true);
  });
});
