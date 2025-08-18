import { Stack } from 'expo-router';
import { stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function MainLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={stackScreenOptions} />
      <Stack.Screen name="attempts/index" options={withHeaderFromParams()} />
      <Stack.Screen name="attempts/[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="attempts/therapist/index" options={withHeaderFromParams()} />
      <Stack.Screen name="attempts/therapist/[id]/index" options={withHeaderFromParams()} />
    </Stack>
  );
}
