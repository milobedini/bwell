import PatientAttemptDetail from '@/components/attempts/PatientAttemptDetail';
import TherapistAttemptDetail from '@/components/attempts/TherapistAttemptDetail';
import ContentContainer from '@/components/ContentContainer';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

const AttemptDetail = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <ContentContainer>
      {isTherapist(user?.roles) && <TherapistAttemptDetail />}
      {isPatient(user?.roles) && <PatientAttemptDetail />}
    </ContentContainer>
  );
};

export default AttemptDetail;
