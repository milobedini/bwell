import { Stack } from 'expo-router';
import { stackScreenOptionsWithTitle, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function JourneyLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithTitle('Journey')}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={withHeaderFromParams()} />
    </Stack>
  );
}
