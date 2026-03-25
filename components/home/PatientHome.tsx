import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ContentContainer from '@/components/ContentContainer';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { PrimaryButton, SecondaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import { usePatientDashboard } from '@/hooks/usePatientDashboard';
import { useProfile } from '@/hooks/useUsers';

import { HomeScreen } from './HomeScreen';
import PatientDashboard from './PatientDashboard';

const PatientHome = () => {
  const router = useRouter();
  const { data, isPending, isError, isRefetching, refetch } = usePatientDashboard();
  const { data: profile } = useProfile();
  const insets = useSafeAreaInsets();
  const firstName = profile?.name?.split(' ')[0] || profile?.username || '';

  // Loading state
  if (isPending) {
    return <HomeScreen content={<LoadingIndicator marginBottom={0} />} />;
  }

  // Error state
  if (isError || !data) {
    return (
      <View className="flex-1 bg-sway-dark" style={{ paddingTop: insets.top }}>
        <EmptyState icon="alert-circle-outline" title="Could not load dashboard" subtitle="Pull down to retry" />
      </View>
    );
  }

  // Empty state: show branded HomeScreen with CTAs
  if (!data.hasData) {
    return (
      <HomeScreen
        content={
          <ContentContainer>
            <View className="items-center gap-3 px-4">
              <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
                Welcome to bwell
              </ThemedText>
              <ThemedText type="small" style={{ textAlign: 'center', lineHeight: 20 }}>
                Your therapy companion.{'\n'}Let&apos;s get started.
              </ThemedText>
              <View className="mt-4 w-full gap-2.5">
                <PrimaryButton
                  title="Take your first questionnaire"
                  onPress={() => router.push('/(main)/(tabs)/programs')}
                />
                <SecondaryButton title="Explore programs" onPress={() => router.push('/(main)/(tabs)/programs')} />
              </View>
            </View>
          </ContentContainer>
        }
      />
    );
  }

  // Populated state: functional dashboard
  return (
    <View className="flex-1 bg-sway-dark" style={{ paddingTop: insets.top }}>
      <PatientDashboard firstName={firstName} data={data} isRefetching={isRefetching} refetch={refetch} />
    </View>
  );
};

export default PatientHome;
