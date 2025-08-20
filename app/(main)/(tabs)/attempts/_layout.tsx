import { Stack } from 'expo-router';
import { stackScreenOptions, stackScreenOptionsWithTitle, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function AttemptsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      {/* Both routes should be the same, then the route index handles the rendering. */}
      <Stack.Screen name="index" options={stackScreenOptionsWithTitle('Attempts')} />
      <Stack.Screen name="[id]/index" options={withHeaderFromParams()} />
    </Stack>
  );
}
