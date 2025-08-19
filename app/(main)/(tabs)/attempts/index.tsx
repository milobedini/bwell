import { View } from 'react-native';
import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';

import AttemptTherapistList from './therapist';

// Render either patient or therapist attempts
const AttemptsList = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <Container>
      {isTherapist(user?.roles) && <AttemptTherapistList />}
      {isPatient(user?.roles) && (
        <View>
          <ThemedText>Patient Attempts list</ThemedText>
        </View>
      )}
    </Container>
  );
};

export default AttemptsList;
