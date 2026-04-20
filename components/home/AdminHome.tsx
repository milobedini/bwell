import { useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import useToggle from '@/hooks/useToggle';
import { computeAttentionScore } from '@/utils/attentionScore';
import type { AuthUser } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import TherapistPicker from '../user/TherapistPicker';

import AttentionBanner from './admin-dashboard/AttentionBanner';
import FreshnessRow from './admin-dashboard/FreshnessRow';
import LeadProgrammeCard from './admin-dashboard/LeadProgrammeCard';
import OpsFooter from './admin-dashboard/OpsFooter';
import ProgrammeRow from './admin-dashboard/ProgrammeRow';
import { HomeScreen } from './HomeScreen';

const AdminHome = () => {
  const { data, isPending, isError, refetch, isRefetching } = useAdminOverview();
  const [pickerVisible, togglePickerVisible] = useToggle(false);
  const insets = useSafeAreaInsets();

  const score = useMemo(() => (data ? computeAttentionScore(data) : null), [data]);

  // Adapt /overview's verification queue preview into AuthUser shape for the picker.
  const unverifiedTherapists = useMemo<AuthUser[]>(
    () =>
      (data?.verificationQueue.oldest ?? []).map((row) => ({
        _id: row.userId,
        username: row.username,
        email: row.email,
        name: row.name,
        roles: ['therapist'],
        isVerifiedTherapist: false,
        therapistTier: row.therapistTier ?? undefined
      })),
    [data]
  );

  if (isPending) return <HomeScreen content={<LoadingIndicator marginBottom={0} />} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  const leadProgramme = data.programmes.find((p) => p.outcomes !== null) ?? null;
  const otherProgrammes = data.programmes.filter((p) => p !== leadProgramme);

  return (
    <View className="flex-1 bg-sway-dark" testID="home-screen" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
      >
        <ContentContainer>
          <View className="py-2">
            <ThemedText
              type="small"
              style={{
                color: Colors.sway.darkGrey,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase'
              }}
            >
              Admin overview
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: Colors.sway.lightGrey, marginTop: 4 }}>
              Clinical outcomes first
            </ThemedText>
            <View className="mt-3">
              <FreshnessRow asOf={data.asOf} rollupAsOf={data.rollupAsOf} privacyMode={data.privacyMode} />
            </View>
          </View>

          {score && (
            <View className="mt-4">
              <AttentionBanner score={score} onPressVerification={togglePickerVisible} />
            </View>
          )}

          {leadProgramme && (
            <View className="mt-5">
              <LeadProgrammeCard programme={leadProgramme} />
            </View>
          )}

          {otherProgrammes.length > 0 && (
            <View className="mt-5">
              <ThemedText
                type="small"
                style={{
                  color: Colors.sway.darkGrey,
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginBottom: 8
                }}
              >
                Other programmes
              </ThemedText>
              <View className="gap-2">
                {otherProgrammes.map((p) => (
                  <ProgrammeRow key={p.programmeId} programme={p} />
                ))}
              </View>
            </View>
          )}

          <View className="mt-6">
            <OpsFooter operational={data.operational} verificationCount={data.verificationQueue.count} />
          </View>

          <View className="h-8" />
        </ContentContainer>
      </ScrollView>
      <TherapistPicker visible={pickerVisible} onDismiss={togglePickerVisible} therapists={unverifiedTherapists} />
    </View>
  );
};

export default AdminHome;
