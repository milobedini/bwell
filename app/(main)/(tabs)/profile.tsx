import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useLogout, useProfile } from '@/hooks/useAuth';

export default function Profile() {
  const { data, isPending, isError } = useProfile();
  const logout = useLogout();
  const { isSuccess: logoutSuccess } = logout;
  const router = useRouter();

  const handleLogout = useCallback(() => {
    logout.mutate();
  }, [logout]);

  useEffect(() => {
    if (logoutSuccess) {
      router.replace('/(auth)/login');
    }
  }, [logoutSuccess, router]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.NOT_FOUND} />;

  return (
    <Container>
      <ThemedText type="title" className="text-center">
        {data.username}
      </ThemedText>
      <View className="gap-2 p-4">
        <ThemedText>Your registered email is {data.email}</ThemedText>
        <ThemedButton onPress={handleLogout} disabled={isPending}>
          Log Out
        </ThemedButton>
      </View>
    </Container>
  );
}
