import { Button } from 'react-native';
import { router } from 'expo-router';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

export default function Profile() {
  return (
    <Container>
      <ThemedText>Profile Screen</ThemedText>
      <Button title="Log Out" onPress={() => router.replace('/(auth)/login')} />
    </Container>
  );
}
