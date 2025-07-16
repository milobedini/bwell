import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

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

  if (logout.isPending) return <LoadingIndicator marginBottom={0} />;

  if (!user) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <ThemedText type="title" className="text-center">
        {user.username}
      </ThemedText>
      <View className="gap-2 p-4">
        <ThemedText>Your registered email is {user.email}</ThemedText>
        <ThemedButton onPress={handleLogout} disabled={!user}>
          Log Out
        </ThemedButton>
      </View>
    </Container>
  );
}
