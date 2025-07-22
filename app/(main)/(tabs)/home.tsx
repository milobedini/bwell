import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import { ThemedText } from '@/components/ThemedText';

export default function Home() {
  return (
    <Container>
      <ContentContainer>
        <ThemedText>Home Screen</ThemedText>
      </ContentContainer>
    </Container>
  );
}
