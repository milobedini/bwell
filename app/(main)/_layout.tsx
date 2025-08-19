import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function MainLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={stackScreenOptions} />
    </Stack>
  );
}
