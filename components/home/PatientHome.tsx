import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import ContentContainer from '../ContentContainer';
import { PrimaryButton } from '../ThemedButton';

import { HomeScreen } from './HomeScreen';

const PatientHome = () => {
  const router = useRouter();

  const handleNavigateActiveAttempts = useCallback(() => {
    router.replace({
      pathname: '/(main)/(tabs)/attempts'
    });
  }, [router]);

  const content = (
    <ContentContainer>
      <PrimaryButton title="Active attempts" onPress={handleNavigateActiveAttempts}></PrimaryButton>
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default PatientHome;
