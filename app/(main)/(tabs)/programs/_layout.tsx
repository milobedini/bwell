import { Stack } from 'expo-router';

export default function ProgramsStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false // default hidden
      }}
    />
  );
}
