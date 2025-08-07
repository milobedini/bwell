import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function WelcomeLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
