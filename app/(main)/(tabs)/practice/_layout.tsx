import { Stack } from 'expo-router';
import { nestedScreenOptions, stackScreenOptionsWithTitle } from '@/utils/defaultScreenOptions';

export default function PracticeLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithTitle('Practice')}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={nestedScreenOptions} />
    </Stack>
  );
}
