import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ChangePasswordDialog from '@/components/profile/ChangePasswordDialog';
import ClientsSummaryCard from '@/components/profile/ClientsSummaryCard';
import EditNameDialog from '@/components/profile/EditNameDialog';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { PatientStats, StatsStripSkeleton, TherapistStats } from '@/components/profile/ProfileStatsStrip';
import SettingsGroup from '@/components/profile/SettingsGroup';
import SettingsRow from '@/components/profile/SettingsRow';
import TherapistCard from '@/components/profile/TherapistCard';
import { useLogout } from '@/hooks/useAuth';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useTherapistDashboard } from '@/hooks/useTherapistDashboard';
import { useClients, useProfile } from '@/hooks/useUsers';
import { isPatient, isTherapist } from '@/utils/userRoles';

export default function Profile() {
  const router = useRouter();
  const { data: profile, isError, isPending } = useProfile();

  const logout = useLogout();
  const { isSuccess: logoutSuccess } = logout;

  const [editNameVisible, setEditNameVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const isTherapistRole = useMemo(() => isTherapist(profile?.roles), [profile?.roles]);
  const isPatientRole = useMemo(() => isPatient(profile?.roles), [profile?.roles]);

  // Role-guarded data fetching — only call APIs relevant to the user's role
  const { data: patientStats, isPending: statsLoading } = useProfileStats(isPatientRole);
  const { data: dashboardData, isPending: dashboardLoading } = useTherapistDashboard(isTherapistRole);
  const { data: clients } = useClients(undefined, isTherapistRole);

  const handleLogout = useCallback(() => logout.mutate(), [logout]);
  const dismissEditName = useCallback(() => setEditNameVisible(false), []);
  const dismissChangePassword = useCallback(() => setChangePasswordVisible(false), []);

  useEffect(() => {
    if (logoutSuccess) {
      router.replace('/(auth)/login');
    }
  }, [logoutSuccess, router]);

  if (logout.isPending || isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError || !profile) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  const appVersion = Constants.expoConfig?.version ?? '0.0.0';

  return (
    <Container>
      <ScrollView
        className="flex-1 bg-sway-dark"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Identity Header */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          className="pb-5 pt-4"
        >
          <ProfileHeader profile={profile} />
        </MotiView>

        {/* Section 2: Relationship Card */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 80 }}
          className="pb-4"
        >
          {isPatientRole && <TherapistCard therapist={profile.therapist} />}
          {isTherapistRole && (
            <ClientsSummaryCard clients={clients ?? []} onPress={() => router.push('/(main)/(tabs)/patients')} />
          )}
        </MotiView>

        {/* Section 3: Stats Strip */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 160 }}
          className="pb-6"
        >
          {isPatientRole &&
            (statsLoading ? <StatsStripSkeleton /> : patientStats && <PatientStats stats={patientStats} />)}
          {isTherapistRole &&
            (dashboardLoading ? (
              <StatsStripSkeleton />
            ) : (
              dashboardData && <TherapistStats stats={dashboardData.stats} />
            ))}
        </MotiView>

        {/* Section 4: Grouped Settings */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 240 }}
        >
          {/* Account */}
          <SettingsGroup title="Account">
            <SettingsRow icon="account-edit-outline" label="Edit Name" onPress={() => setEditNameVisible(true)} />
            <SettingsRow icon="lock-outline" label="Change Password" onPress={() => setChangePasswordVisible(true)} />
            <SettingsRow icon="email-outline" label="Email" trailing={profile.email} showChevron={false} />
          </SettingsGroup>

          {/* Client Management (therapist only) */}
          {isTherapistRole && (
            <SettingsGroup title="Client Management">
              <SettingsRow
                icon="account-multiple-outline"
                label="All Patients"
                onPress={() => router.push('/(main)/(tabs)/profile/patients')}
              />
            </SettingsGroup>
          )}

          {/* Support */}
          <SettingsGroup title="Support">
            <SettingsRow icon="help-circle-outline" label="Help & FAQ" />
            <SettingsRow icon="message-text-outline" label="Send Feedback" />
            <SettingsRow icon="information-outline" label="About" trailing={`v${appVersion}`} showChevron={false} />
          </SettingsGroup>

          {/* Danger Zone */}
          <SettingsGroup title="Danger Zone">
            <SettingsRow
              icon="logout"
              label="Log Out"
              onPress={handleLogout}
              destructive
              showChevron={false}
              testID="profile-logout-button"
            />
          </SettingsGroup>
        </MotiView>
      </ScrollView>

      <EditNameDialog visible={editNameVisible} onDismiss={dismissEditName} />
      <ChangePasswordDialog visible={changePasswordVisible} onDismiss={dismissChangePassword} />
    </Container>
  );
}
