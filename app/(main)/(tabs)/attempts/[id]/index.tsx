import PatientAttemptDetail from '@/components/attempts/PatientAttemptDetail';
import TherapistAttemptDetail from '@/components/attempts/TherapistAttemptDetail';
import Container from '@/components/Container';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

const AttemptDetail = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <Container>
      {isTherapist(user?.roles) && <TherapistAttemptDetail />}
      {isPatient(user?.roles) && <PatientAttemptDetail />}
    </Container>
  );
};

export default AttemptDetail;
