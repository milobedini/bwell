import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import Container from '@/components/Container';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';

export default function NotFoundScreen() {
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setRedirecting(false), 3000);
    return () => clearTimeout(id); // cleanup
  }, []);

  if (!redirecting) {
    return <Redirect href="/" />;
  }

  return (
    <Container centered>
      <ThemedText type="subtitle" className="p-4">
        We could not find this screen! Redirecting...
      </ThemedText>
      <LoadingIndicator marginBottom={0} />
    </Container>
  );
}
