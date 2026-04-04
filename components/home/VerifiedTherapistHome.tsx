import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useUsers';

import TherapistDashboard from './TherapistDashboard';

const VerifiedTherapistHome = () => {
  const { data: profile } = useProfile();
  const insets = useSafeAreaInsets();
  const firstName = profile?.name?.split(' ')[0] || profile?.username || '';

  return (
    <View className="flex-1 bg-sway-dark" testID="home-screen" style={{ paddingTop: insets.top }}>
      <TherapistDashboard firstName={firstName} />
    </View>
  );
};

export default VerifiedTherapistHome;
