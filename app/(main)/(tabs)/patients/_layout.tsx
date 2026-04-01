import { Stack } from 'expo-router';
import {
  nestedScreenOptions,
  nestedScreenOptionsWithTitle,
  stackScreenOptionsWithTitle
} from '@/utils/defaultScreenOptions';

export default function PatientsLayout() {
  return (
    <Stack screenOptions={stackScreenOptionsWithTitle('Patients')}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={nestedScreenOptions} />
      <Stack.Screen name="add" options={nestedScreenOptionsWithTitle('Create Assignment')} />
    </Stack>
  );
}
