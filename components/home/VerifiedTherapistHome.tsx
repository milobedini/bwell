import { Link } from 'expo-router';

import ContentContainer from '../ContentContainer';
import { PrimaryButton } from '../ThemedButton';

import { HomeScreen } from './HomeScreen';

const VerifiedTherapistHome = () => {
  const content = (
    <ContentContainer>
      <Link asChild href={'/home/clients'}>
        <PrimaryButton title="Your clients" />
      </Link>
      <Link asChild href={'/home/patients'}>
        <PrimaryButton title="All patients" />
      </Link>
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default VerifiedTherapistHome;
