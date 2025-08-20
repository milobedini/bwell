import TherapistAttemptDetail from '@/components/attempts/TherapistAttemptDetail';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

const AttemptDetail = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <Container>
      {isTherapist(user?.roles) && <TherapistAttemptDetail />}
      {isPatient(user?.roles) && <ThemedText>Patient Attempt Detail</ThemedText>}
    </Container>
  );
};

export default AttemptDetail;
