import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/utils/defaultScreenOptions';

export default function AllUsersStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
