import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function JourneyLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
