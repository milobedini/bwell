import { Stack } from 'expo-router';
import { stackScreenOptions, stackScreenOptionsWithTitle } from '@/utils/defaultScreenOptions';

export default function AssignmentsStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={stackScreenOptionsWithTitle('Assignments')} />
      {/* <Stack.Screen name="[id]/index" options={withHeaderFromParams()} />
      <Stack.Screen name="[id]/modules" options={withHeaderFromParams()} /> */}
    </Stack>
  );
}
