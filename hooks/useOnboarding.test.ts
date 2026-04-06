import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';

import { markOnboardingComplete, useHasOnboarded } from './useOnboarding';

describe('markOnboardingComplete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('persists onboarding flag to AsyncStorage', async () => {
    await markOnboardingComplete();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasSeenOnboarding', 'true');
  });

  it('does not throw when AsyncStorage fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    await expect(markOnboardingComplete()).resolves.toBeUndefined();
    (console.warn as jest.Mock).mockRestore();
  });
});

describe('useHasOnboarded', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns true when onboarding has been completed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

    const { result } = renderHook(() => useHasOnboarded());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when onboarding has not been completed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useHasOnboarded());

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns false when AsyncStorage read fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('corrupt'));

    const { result } = renderHook(() => useHasOnboarded());

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('starts as null (loading state)', () => {
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useHasOnboarded());

    expect(result.current).toBeNull();
  });
});
