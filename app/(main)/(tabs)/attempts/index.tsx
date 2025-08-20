import { View } from 'react-native';
import TherapistLatestAttempts from '@/components/attempts/TherapistLatestAttempts';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

// Todo: if you want to toggle between active/inactive, filter etc. create some toggles that are passed into the search params.
const AttemptsList = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <Container>
      {isTherapist(user?.roles) && <TherapistLatestAttempts />}
      {isPatient(user?.roles) && (
        <View>
          <ThemedText>Patient Attempts list</ThemedText>
        </View>
      )}
    </Container>
  );
};

export default AttemptsList;
