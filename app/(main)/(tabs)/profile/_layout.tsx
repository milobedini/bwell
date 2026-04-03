import { Stack } from 'expo-router';
import { nestedScreenOptionsWithTitle, stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="patients/index" options={nestedScreenOptionsWithTitle('All Patients')} />
    </Stack>
  );
}
