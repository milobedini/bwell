import { Stack } from 'expo-router';

export default function ModuleDetailStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false // default hidden
      }}
    />
  );
}
