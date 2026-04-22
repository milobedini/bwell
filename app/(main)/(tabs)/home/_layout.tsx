import { Stack } from 'expo-router';
import { nestedScreenOptionsWithTitle, stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export const unstable_settings = {
  initialRouteName: 'index'
};

export default function HomeStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="practice/[id]" options={withHeaderFromParams()} />
      <Stack.Screen name="programmes/[id]" options={withHeaderFromParams()} />
      <Stack.Screen name="audit" options={nestedScreenOptionsWithTitle('Audit log')} />
      <Stack.Screen name="system" options={nestedScreenOptionsWithTitle('System health')} />
      <Stack.Screen name="stalled-attempts" options={nestedScreenOptionsWithTitle('Stalled attempts')} />
      <Stack.Screen name="orphaned-assignments" options={nestedScreenOptionsWithTitle('Orphaned assignments')} />
    </Stack>
  );
}
