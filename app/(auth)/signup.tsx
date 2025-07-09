import { Button, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function Signup() {
  return (
    <View>
      <Text>Signup Screen</Text>
      <Button title="Back to login" onPress={() => router.back()} />
    </View>
  );
}
