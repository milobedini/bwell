import PatientAttempts from '@/components/attempts/PatientAttempts';
import TherapistLatestAttempts from '@/components/attempts/TherapistLatestAttempts';
import Container from '@/components/Container';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

// Todo: if you want to toggle between active/inactive, filter etc. create some toggles that are passed into the search params.
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
