import { View } from 'react-native';

import { BWellLogo } from '../brand/Imagery';
import Container from '../Container';
import ContentContainer from '../ContentContainer';
import { ThemedText } from '../ThemedText';

const UnverifiedTherapistHome = () => {
  return (
    <Container>
      <ContentContainer>
        <ThemedText type="title" className="mt-4">
          You are awaiting BWell verification
        </ThemedText>
        <View className="mt-auto items-center">
          <BWellLogo />
        </View>
      </ContentContainer>
    </Container>
  );
};

export default UnverifiedTherapistHome;
