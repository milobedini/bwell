import { Stack } from 'expo-router';
import { stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function ProgramsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="[id]/modules" options={withHeaderFromParams()} />
    </Stack>
  );
}
