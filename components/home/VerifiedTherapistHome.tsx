import { View } from 'react-native';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useProfile } from '@/hooks/useUsers';

import TherapistDashboard from './TherapistDashboard';

import bWellLogo from '../../assets/images/logo.png';

const VerifiedTherapistHome = () => {
  const { data: profile } = useProfile();
  const firstName = profile?.name?.split(' ')[0] || profile?.username || '';

  return (
    <View className="flex-1 bg-sway-dark">
      <View className="flex-row justify-center pb-[22]" style={{ marginTop: Constants.statusBarHeight + 22 }}>
        <Image source={bWellLogo} style={{ aspectRatio: 2000 / 1247, width: 140 }} />
      </View>
      <TherapistDashboard firstName={firstName} />
    </View>
  );
};

export default VerifiedTherapistHome;
