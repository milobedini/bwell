import { Button } from 'react-native';
import { router } from 'expo-router';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

export default function Signup() {
  return (
    <Container>
      <ThemedText>Signup Screen</ThemedText>
      <Button title="Back to login" onPress={() => router.replace('/(auth)/login')} />
    </Container>
  );
}
