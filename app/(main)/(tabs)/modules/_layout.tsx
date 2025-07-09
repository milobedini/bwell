import { Stack } from 'expo-router';

export default function ModulesStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false // default hidden
      }}
    />
  );
}
