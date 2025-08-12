import { View } from 'react-native';
import useToggle from '@/hooks/useToggle';
import { useAdminStats } from '@/hooks/useUsers';

import { BWellLogo } from '../brand/Imagery';
import Container from '../Container';
import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import TherapistPicker from '../user/TherapistPicker';

const AdminHome = () => {
  const { data, isPending, isError } = useAdminStats();
  const [pickerVisible, togglePickerVisible] = useToggle(false);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data && !isPending) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  return (
    <Container>
      <ContentContainer>
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
              <ThemedButton compact onPress={togglePickerVisible} className="">
                Verify
              </ThemedButton>
            </View>
          )}
        </View>
        <View className="mt-auto items-center">
          <BWellLogo />
        </View>
      </ContentContainer>
      <TherapistPicker visible={pickerVisible} onDismiss={togglePickerVisible} therapists={data.unverifiedTherapists} />
    </Container>
  );
};

export default AdminHome;
