import { useState } from 'react';
import { Redirect } from 'expo-router';
import Container from '@/components/Container';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';

export default function NotFoundScreen() {
  const [redirecting, setRedirecting] = useState(true);

  // Simulate a redirect after a short delay
  setTimeout(() => {
    setRedirecting(false);
    return <Redirect href={'/'} />;
  }, 3000);

  return (
    <Container centered>
      <ThemedText type="subtitle" className="p-4">
        We could not find this screen! Redirecting...
      </ThemedText>
      {redirecting && <LoadingIndicator marginBottom={0} />}
    </Container>
  );
}
