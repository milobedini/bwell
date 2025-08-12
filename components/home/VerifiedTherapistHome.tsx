import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { BWellLogo } from '../brand/Imagery';
import Container from '../Container';
import ContentContainer from '../ContentContainer';
import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';

const VerifiedTherapistHome = () => {
  const router = useRouter();

  return (
    <Container>
      <ContentContainer>
        <ThemedText>Verified therapist home</ThemedText>
        <ThemedButton className="mb-4" onPress={() => router.push('/home/clients')}>
          Your clients
        </ThemedButton>
        <ThemedButton onPress={() => router.push('/home/patients')}>All patients</ThemedButton>
        <View className="mt-auto items-center">
          <BWellLogo />
        </View>
      </ContentContainer>
    </Container>
  );
};

export default VerifiedTherapistHome;
