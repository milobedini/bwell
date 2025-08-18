import { Stack } from 'expo-router';
import { stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function AssignmentsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={stackScreenOptions} />
      <Stack.Screen name="[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="add" options={withHeaderFromParams()} />
    </Stack>
  );
}
