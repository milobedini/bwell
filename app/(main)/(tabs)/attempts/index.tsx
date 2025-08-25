import PatientAttempts from '@/components/attempts/PatientAttempts';
import TherapistLatestAttempts from '@/components/attempts/TherapistLatestAttempts';
import Container from '@/components/Container';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

const AttemptsList = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <Container>
      {isTherapist(user?.roles) && <TherapistLatestAttempts />}
      {isPatient(user?.roles) && <PatientAttempts />}
    </Container>
  );
};

export default AttemptsList;
