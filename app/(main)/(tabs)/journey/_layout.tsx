import { Stack } from 'expo-router';
import { stackScreenOptionsWithTitle } from '@/utils/defaultScreenOptions';

export default function JourneyLayout() {
  return <Stack screenOptions={stackScreenOptionsWithTitle('Journey')} />;
}
