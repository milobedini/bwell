import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function PatientsLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
