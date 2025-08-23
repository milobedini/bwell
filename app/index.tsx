import { Redirect, useRootNavigationState } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { Colors } from '@/constants/Colors';
import { useHasOnboarded } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/stores/authStore';

SystemUI.setBackgroundColorAsync(Colors.sway.dark);

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
