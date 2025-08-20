import { Link } from 'expo-router';

import ContentContainer from '../ContentContainer';
import { PrimaryButton } from '../ThemedButton';

import { HomeScreen } from './HomeScreen';

const PatientHome = () => {
  const content = (
    <ContentContainer>
      <Link asChild href={'/(main)/(tabs)/attempts'}>
        <PrimaryButton title="Active attempts" />
      </Link>
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default PatientHome;
