import { useEffect } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

function IndexRedirect() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const navigatorReady = rootNavigationState?.key != null;

  const user = useAuthStore((s) => s.user);
  const onboarded = true;

  useEffect(() => {
    if (!navigatorReady) return;
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
