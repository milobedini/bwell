import { View } from 'react-native';
import useToggle from '@/hooks/useToggle';
import { useAdminStats } from '@/hooks/useUsers';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { PrimaryButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import TherapistPicker from '../user/TherapistPicker';

import { HomeScreen } from './HomeScreen';

const AdminHome = () => {
  const { data, isPending, isError } = useAdminStats();
  const [pickerVisible, togglePickerVisible] = useToggle(false);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data && !isPending) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  const content = (
    <ContentContainer className="z-10">
      <View className="gap-6 p-2">
        <View className="gap-2">
          <ThemedText type="subtitle">Total Users: {data.totalUsers}</ThemedText>
          <ThemedText>
            {data.totalPatients} patients & {data.totalTherapists} therapists
          </ThemedText>
        </View>
        <ThemedText type="smallTitle">{data.completedAttempts} modules completed this week</ThemedText>
        {!!data.unverifiedTherapists.length && (
          <View className="gap-2">
            <ThemedText type="smallTitle">
              {data.unverifiedTherapists.length} therapist awaiting verification
            </ThemedText>
            <PrimaryButton title="Verify" onPress={togglePickerVisible} />
          </View>
        )}
      </View>
      <TherapistPicker visible={pickerVisible} onDismiss={togglePickerVisible} therapists={data.unverifiedTherapists} />
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default AdminHome;
