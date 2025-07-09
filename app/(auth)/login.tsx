import { Button } from 'react-native';
import { router } from 'expo-router';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

export default function Login() {
  return (
    <Container>
      <ThemedText>Login Screen</ThemedText>
      <Button title="Sign up" onPress={() => router.push('/(auth)/signup')} color={Colors.primary.info} />
      <Button title="Log in" onPress={() => router.replace('/(main)/(tabs)/home')} />
    </Container>
  );
}
