import { Button } from 'react-native';
import { router } from 'expo-router';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

export default function ModuleList() {
  return (
    <Container>
      <ThemedText>Modules List</ThemedText>
      <Button title="Open Module 1" onPress={() => router.push('/(main)/(tabs)/modules/1')} />
    </Container>
  );
}
