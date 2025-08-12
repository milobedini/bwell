import { View } from 'react-native';

import { BWellLogo } from '../brand/Imagery';
import Container from '../Container';
import ContentContainer from '../ContentContainer';
import { ThemedText } from '../ThemedText';

const PatientHome = () => {
  return (
    <Container>
      <ContentContainer>
        <ThemedText>Patient home</ThemedText>
        <View className="mt-auto items-center">
          <BWellLogo />
        </View>
      </ContentContainer>
    </Container>
  );
};

export default PatientHome;
