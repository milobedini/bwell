import { useRouter } from 'expo-router';

import ContentContainer from '../ContentContainer';
import { PrimaryButton } from '../ThemedButton';

import { HomeScreen } from './HomeScreen';

const VerifiedTherapistHome = () => {
  const router = useRouter();

  const content = (
    <ContentContainer>
      <PrimaryButton title="Your clients" onPress={() => router.push('/home/clients')} />
      <PrimaryButton title="All patients" onPress={() => router.push('/home/patients')} />
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default VerifiedTherapistHome;
