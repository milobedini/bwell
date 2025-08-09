import { Stack } from 'expo-router';
import { nestedScreenOptionsWithTitle, stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function ProgramsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index" options={nestedScreenOptionsWithTitle('Program modules')} />
      <Stack.Screen name="[id]/modules" options={nestedScreenOptionsWithTitle('Module')} />
    </Stack>
  );
}
