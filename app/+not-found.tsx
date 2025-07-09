import { Stack } from 'expo-router';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Container>
        <ThemedText type="subtitle">I am the not found view</ThemedText>
      </Container>
    </>
  );
}
