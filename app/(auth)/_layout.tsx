import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function AuthLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
