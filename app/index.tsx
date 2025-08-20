import { Redirect, useRootNavigationState } from 'expo-router';
import { useHasOnboarded } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/stores/authStore';

function IndexRedirect() {
  const rootNavigationState = useRootNavigationState();
  const navigatorReady = rootNavigationState?.key != null;

  const user = useAuthStore((s) => s.user);
  const onboarded = useHasOnboarded();

  if (!navigatorReady || onboarded === null) return;
  if (user) {
    return <Redirect href={'/(main)/(tabs)/home'} />;
  } else if (onboarded) {
    return <Redirect href={'/(auth)/login'} />;
  } else {
    return <Redirect href={'/(welcome)/ready'} />;
  }
}

export default IndexRedirect;
