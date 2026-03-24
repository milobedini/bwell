import { useProfile } from '@/hooks/useUsers';

import { HomeScreen } from './HomeScreen';
import TherapistDashboard from './TherapistDashboard';

const VerifiedTherapistHome = () => {
  const { data: profile } = useProfile();
  const firstName = profile?.name?.split(' ')[0] || profile?.username || '';

  const content = <TherapistDashboard firstName={firstName} />;

  return <HomeScreen content={content} />;
};

export default VerifiedTherapistHome;
