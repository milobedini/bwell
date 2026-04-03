import { Stack } from 'expo-router';
import {
  nestedScreenOptions,
  nestedScreenOptionsWithTitle,
  stackScreenOptionsWithTitle,
  withHeaderFromParams
} from '@/utils/defaultScreenOptions';

export default function PatientsLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithTitle('Clients')}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={nestedScreenOptions} />
      <Stack.Screen name="attempt/[id]" options={withHeaderFromParams()} />
      <Stack.Screen name="add" options={nestedScreenOptionsWithTitle('Create Assignment')} />
      <Stack.Screen name="edit" options={withHeaderFromParams()} />
    </Stack>
  );
}
