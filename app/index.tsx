import { useEffect } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useHasOnboarded } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/stores/authStore';

function IndexRedirect() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const navigatorReady = rootNavigationState?.key != null;

  const user = useAuthStore((s) => s.user);
  const onboarded = useHasOnboarded();

  useEffect(() => {
    if (!navigatorReady || onboarded === null) return;
    if (user) {
      router.replace('/(main)/(tabs)/home');
    } else if (onboarded) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(welcome)/ready');
    }
  }, [user, onboarded, navigatorReady, router]);

  return null; // blank screen during redirect
}

export default IndexRedirect;
