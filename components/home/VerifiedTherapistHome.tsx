import { Link } from 'expo-router';

import ContentContainer from '../ContentContainer';
import { PrimaryButton } from '../ThemedButton';

import { HomeScreen } from './HomeScreen';

const VerifiedTherapistHome = () => {
  const content = (
    <ContentContainer className="gap-6">
      <Link asChild href={'/home/clients'}>
        <PrimaryButton title="Your clients" />
      </Link>
      <Link asChild href={'/home/patients'}>
        <PrimaryButton title="All patients" />
      </Link>
      {/* Test navigation to nested route */}
      {/* <Link
        asChild
        href={{
          pathname: '/programs/[id]',
          params: { id: '6899a2977019be5802ba1b1d', headerTitle: 'Depression' }
        }}
        withAnchor
      >
        <PrimaryButton title="Deep program link" />
      </Link> */}
    </ContentContainer>
  );

  return <HomeScreen content={content} />;
};

export default VerifiedTherapistHome;
