import { Stack } from 'expo-router';
import { stackScreenOptions, stackScreenOptionsWithTitle, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function AttemptsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={stackScreenOptionsWithTitle('Completed Attempts')} />
      <Stack.Screen name="[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="therapist/index" options={withHeaderFromParams()} />
      <Stack.Screen name="therapist/[id]/index" options={withHeaderFromParams()} />
    </Stack>
  );
}
