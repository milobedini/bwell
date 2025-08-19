import { Stack } from 'expo-router';
import { nestedScreenOptionsWithTitle, stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="attempts/index" options={nestedScreenOptionsWithTitle('Your attempts')} />
      <Stack.Screen name="attempts/[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="attempts/therapist/index" options={nestedScreenOptionsWithTitle('Client attempts')} />
      <Stack.Screen name="attempts/therapist/[id]/index" options={withHeaderFromParams()} />
    </Stack>
  );
}
