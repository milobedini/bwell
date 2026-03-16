import PatientAttempts from '@/components/attempts/PatientAttempts';
import TherapistLatestAttempts from '@/components/attempts/TherapistLatestAttempts';
import ContentContainer from '@/components/ContentContainer';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

const AttemptsList = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <ContentContainer>
      {isTherapist(user?.roles) && <TherapistLatestAttempts />}
      {isPatient(user?.roles) && <PatientAttempts />}
    </ContentContainer>
  );
};

export default AttemptsList;
