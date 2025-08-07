import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { isTherapist } from '@/utils/userRoles';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  if (isTherapist(user?.roles))
    return (
      <Container>
        <ContentContainer>
          <ThemedText>Therapist home</ThemedText>
          <ThemedButton onPress={() => router.push('/home/patients')}>All patients</ThemedButton>
        </ContentContainer>
      </Container>
    );

  return (
    <Container>
      <ContentContainer>
        <ThemedText>Patient home</ThemedText>
      </ContentContainer>
    </Container>
  );
}
