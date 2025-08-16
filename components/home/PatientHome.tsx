import ContentContainer from '../ContentContainer';
import { ThemedText } from '../ThemedText';

import { HomeScreen } from './HomeScreen';

const PatientHome = () => {
  const content = (
    <ContentContainer>
      <ThemedText>Patient home</ThemedText>
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default PatientHome;
