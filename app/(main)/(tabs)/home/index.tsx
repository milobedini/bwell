import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import AdminHome from '@/components/home/AdminHome';
import PatientHome from '@/components/home/PatientHome';
import UnverifiedTherapistHome from '@/components/home/UnverifiedTherapistHome';
import VerifiedTherapistHome from '@/components/home/VerifiedTherapistHome';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useProfile } from '@/hooks/useUsers';
import { isAdmin, isPatient, isTherapist, isVerifiedTherapist } from '@/utils/userRoles';

export default function Home() {
  const { data: user, isPending, isError } = useProfile();

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!user && !isPending) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  if (isAdmin(user.roles)) return <AdminHome />;

  if (isVerifiedTherapist(user)) return <VerifiedTherapistHome />;

  if (isTherapist(user.roles)) return <UnverifiedTherapistHome />;

  if (isPatient(user.roles)) return <PatientHome />;
}
