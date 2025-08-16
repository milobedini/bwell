import { Stack } from 'expo-router';
import { stackScreenOptions, stackScreenOptionsWithTitle, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function ProgramsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={stackScreenOptionsWithTitle('Programs')} />
      <Stack.Screen name="[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="[id]/modules" options={withHeaderFromParams()} />
    </Stack>
  );
}
