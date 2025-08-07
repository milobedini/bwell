import { Stack } from 'expo-router';
import { nestedScreenOptions, stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function HomeStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="patients/index" options={nestedScreenOptions} />
    </Stack>
  );
}
