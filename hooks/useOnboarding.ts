import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const markOnboardingComplete = async () => {
  try {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  } catch {}
};

export const useHasOnboarded = () => {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasOnboarded(value === 'true');
      } catch {
        setHasOnboarded(false); // fallback
      }
    };
    loadOnboardingStatus();
  }, []);

  return hasOnboarded;
};
