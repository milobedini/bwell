import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function MainLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={stackScreenOptions} />
    </Stack>
  );
}
