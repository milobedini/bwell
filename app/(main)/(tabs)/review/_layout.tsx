import { Stack } from 'expo-router';
import { stackScreenOptionsWithTitle, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function ReviewLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithTitle('Review')}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={withHeaderFromParams()} />
    </Stack>
  );
}
