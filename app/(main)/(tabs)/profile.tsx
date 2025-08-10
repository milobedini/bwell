import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useLogout } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useUsers';
import { displayUserRoles, isPatient, isTherapist } from '@/utils/userRoles';

export default function Profile() {
  const { data: profile, isError, isPending } = useProfile();

  const logout = useLogout();
  const { isSuccess: logoutSuccess } = logout;
  const router = useRouter();

  const hasFullName = useMemo(() => !!profile?.name, [profile?.name]);

  const handleLogout = useCallback(() => {
    logout.mutate();
  }, [logout]);

  useEffect(() => {
    if (logoutSuccess) {
      router.replace('/(auth)/login');
    }
  }, [logoutSuccess, router]);

  if (logout.isPending || isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError || !profile) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  return (
    <Container>
      <ThemedText type="title" className="text-center">
        {hasFullName ? profile.name : profile.username}
      </ThemedText>
      <ContentContainer className="gap-4 p-4">
        {hasFullName && <ThemedText>Username: {profile.username}</ThemedText>}
        <ThemedText>Assigned roles: {displayUserRoles(profile.roles)}</ThemedText>
        {isTherapist(profile.roles) && (
          <ThemedText>
            {profile.isVerifiedTherapist
              ? 'You are an approved BWell therapist'
              : 'Your therapist verification is pending'}
          </ThemedText>
        )}
        {isPatient(profile.roles) && profile.therapist && (
          <ThemedText>Your therapist is: {profile.therapist.username}</ThemedText>
        )}
        <ThemedText>Your registered email is: {profile.email}</ThemedText>
        <ThemedButton onPress={handleLogout} disabled={!profile}>
          Log Out
        </ThemedButton>
      </ContentContainer>
    </Container>
  );
}
