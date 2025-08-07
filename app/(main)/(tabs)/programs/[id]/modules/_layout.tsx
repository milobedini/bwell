import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function ModuleDetailStack() {
  return <Stack screenOptions={stackScreenOptions} />;
}
