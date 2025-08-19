import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MotiView, SafeAreaView } from 'moti';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ProfileDetails from '@/components/profile/ProfileDetails';
import { SecondaryButton } from '@/components/ThemedButton';
import { Colors } from '@/constants/Colors';
import { useLogout } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useUsers';
import { isPatient, isTherapist } from '@/utils/userRoles';

export default function Profile() {
  const router = useRouter();
  const { data: profile, isError, isPending } = useProfile();

  const logout = useLogout();
  const { isSuccess: logoutSuccess } = logout;

  const therapist = useMemo(() => isTherapist(profile?.roles), [profile?.roles]);
  const patient = useMemo(() => isPatient(profile?.roles), [profile?.roles]);

  const handleLogout = useCallback(() => {
    logout.mutate();
  }, [logout]);

  useEffect(() => {
    if (logoutSuccess) {
      router.replace('/(auth)/login');
    }
  }, [logoutSuccess, router]);

  if (logout.isPending || isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError || !profile) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  return (
    <SafeAreaView className="flex-1 bg-sway-dark">
      <ScrollView
        className="flex-1 bg-sway-dark"
        contentContainerStyle={{
          alignItems: 'stretch'
        }}
      >
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={{
            borderRadius: 20,
            padding: 22,
            backgroundColor: Colors.sway.dark,
            alignItems: 'flex-start'
          }}
        >
          {/* Profile View */}
          <ProfileDetails profile={profile} isTherapist={therapist} isPatient={patient} />
          <Divider bold className="my-4 w-full" />
          {/* End of Profile View */}

          {/* Menu View */}
          <SecondaryButton title="Patient history" onPress={() => router.push('/(main)/(tabs)/attempts')} />
          <SecondaryButton title="Another button" />
          <SecondaryButton onPress={handleLogout} disabled={!profile} title="Log Out" />
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
