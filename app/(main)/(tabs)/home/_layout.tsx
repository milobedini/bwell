import { Stack } from 'expo-router';
import { stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function HomeStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="practice/[id]" options={withHeaderFromParams()} />
    </Stack>
  );
}
