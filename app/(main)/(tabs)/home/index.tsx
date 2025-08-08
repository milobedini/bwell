import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { isTherapist, isVerifiedTherapist } from '@/utils/userRoles';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  if (isVerifiedTherapist(user))
    return (
      <Container>
        <ContentContainer>
          <ThemedText>Verified therapist home</ThemedText>
          <ThemedButton className="mb-4" onPress={() => router.push('/home/clients')}>
            Your clients
          </ThemedButton>
          <ThemedButton onPress={() => router.push('/home/patients')}>All patients</ThemedButton>
        </ContentContainer>
      </Container>
    );

  if (isTherapist(user?.roles))
    return (
      <Container>
        <ContentContainer>
          <ThemedText type="title" className="mt-4">
            You are awaiting BWell verification
          </ThemedText>
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
