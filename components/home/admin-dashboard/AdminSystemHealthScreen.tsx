import { RefreshControl, ScrollView, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAdminSystemHealth } from '@/hooks/useAdminSystemHealth';
import { formatCompactTimeAgo } from '@/utils/dates';
import type { AdminSystemHealthResponse } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../../ErrorComponent';
import { LoadingIndicator } from '../../LoadingScreen';
import { ThemedText } from '../../ThemedText';

type RollupStatus = NonNullable<AdminSystemHealthResponse['rollupLastRun']>['status'];

const STATUS_STYLE: Record<RollupStatus, { tint: string; border: string; accent: string; label: string }> = {
  success: {
    tint: Colors.tint.teal,
    border: Colors.tint.tealBorder,
    accent: Colors.sway.bright,
    label: 'Success'
  },
  partial: {
    tint: Colors.tint.info,
    border: Colors.tint.infoBorder,
    accent: Colors.primary.warning,
    label: 'Partial'
  },
  failure: {
    tint: Colors.tint.error,
    border: Colors.tint.errorBorder,
    accent: Colors.primary.error,
    label: 'Failure'
  }
};

const formatDuration = (startISO: string, endISO: string | null): string | null => {
  if (!endISO) return null;
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSec = secs % 60;
  return remSec === 0 ? `${mins}m` : `${mins}m ${remSec}s`;
};

const numberFormat = new Intl.NumberFormat('en-GB');

const AdminSystemHealthScreen = () => {
  const { data, isLoading, isError, refetch, isRefetching } = useAdminSystemHealth();

  if (isLoading)
    return (
      <View className="flex-1 bg-sway-dark">
        <LoadingIndicator marginBottom={0} />
      </View>
    );
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  const run = data.rollupLastRun;
  const status = run?.status ?? null;
  const statusStyle = status ? STATUS_STYLE[status] : null;
  const duration = run ? formatDuration(run.startedAt, run.completedAt) : null;

  return (
    <ScrollView
      className="flex-1 bg-sway-dark"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
      testID="admin-system-health-screen"
    >
      <ContentContainer>
        <View className="py-3">
          <ThemedText type="eyebrow" style={{ color: Colors.sway.darkGrey }}>
            Admin ops
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: Colors.sway.lightGrey, marginTop: 2 }}>
            System health
          </ThemedText>
        </View>

        <View
          className="mt-2 rounded-2xl border px-4 py-4"
          style={{
            backgroundColor: statusStyle?.tint ?? Colors.tint.neutral,
            borderColor: statusStyle?.border ?? Colors.divider.medium
          }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: (statusStyle?.accent ?? Colors.sway.darkGrey) + '22' }}
            >
              <Icon
                name={status === 'success' ? 'check-circle-outline' : status ? 'sync-alert' : 'cloud-off-outline'}
                size={18}
                color={statusStyle?.accent ?? Colors.sway.darkGrey}
              />
            </View>
            <View className="flex-1">
              <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
                Nightly rollup
              </ThemedText>
              <ThemedText type="caption" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
                {run ? `Last run ${formatCompactTimeAgo(run.completedAt ?? run.startedAt)}` : 'No rollup recorded yet.'}
              </ThemedText>
            </View>
            {statusStyle && (
              <ThemedText type="captionBold" style={{ color: statusStyle.accent, letterSpacing: 0.4 }}>
                {statusStyle.label.toUpperCase()}
              </ThemedText>
            )}
          </View>

          {run && (
            <View className="mt-4 gap-2">
              <HealthRow label="Started" value={new Date(run.startedAt).toLocaleString()} />
              <HealthRow
                label="Completed"
                value={run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Still running'}
              />
              <HealthRow label="Duration" value={duration ?? '—'} />
              <HealthRow label="Rows written" value={numberFormat.format(run.rowsWritten)} />
            </View>
          )}
        </View>

        <View
          className="mt-4 rounded-2xl border px-4 py-4"
          style={{ backgroundColor: Colors.chip.darkCard, borderColor: Colors.divider.medium }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.tint.neutral }}
            >
              <Icon name="clipboard-list-outline" size={18} color={Colors.sway.darkGrey} />
            </View>
            <View className="flex-1">
              <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
                Audit events
              </ThemedText>
              <ThemedText type="caption" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
                Total curated admin actions on record.
              </ThemedText>
            </View>
            <ThemedText type="title" style={{ color: Colors.sway.lightGrey, fontSize: 24 }}>
              {numberFormat.format(data.auditEventsTotal)}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 16, fontSize: 12, lineHeight: 18 }}>
          Rollup metrics run nightly at 02:00 Europe/London. If the service wakes from sleep, missed slots are replayed
          on boot (capped at 60 slots).
        </ThemedText>

        <View className="h-8" />
      </ContentContainer>
    </ScrollView>
  );
};

type HealthRowProps = { label: string; value: string };

const HealthRow = ({ label, value }: HealthRowProps) => (
  <View className="flex-row items-center justify-between">
    <ThemedText type="caption" style={{ color: Colors.sway.darkGrey }}>
      {label}
    </ThemedText>
    <ThemedText type="captionBold" style={{ color: Colors.sway.lightGrey }}>
      {value}
    </ThemedText>
  </View>
);

export default AdminSystemHealthScreen;
