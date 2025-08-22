import { Stack } from 'expo-router';
import { nestedScreenOptionsWithTitle, stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function HomeStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="patients/index" options={nestedScreenOptionsWithTitle('All patients')} />
      <Stack.Screen name="clients/index" options={nestedScreenOptionsWithTitle('Your clients')} />
      <Stack.Screen name="clients/[id]/index" options={withHeaderFromParams()} />
    </Stack>
  );
}
