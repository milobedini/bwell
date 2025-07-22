import { useLocalSearchParams } from 'expo-router';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';

export default function ModuleDetail() {
  const { id } = useLocalSearchParams();

  return (
    <Container>
      <ThemedText>Module Detail: {id}</ThemedText>
    </Container>
  );
}
