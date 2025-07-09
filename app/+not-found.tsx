import { View } from 'react-native';
import { Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center text-white">
        <h2>I am the not found view</h2>
      </View>
    </>
  );
}
