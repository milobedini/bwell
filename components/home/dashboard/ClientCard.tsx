import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatRelativeTime } from '@/utils/dates';
import { getSeverityColors } from '@/utils/severity';
import { DashboardClientItem } from '@milobedini/shared-types';

import { BucketType } from './TriageBucket';

const getLeftBorderColor = (item: DashboardClientItem, bucket: BucketType): string => {
  if (bucket === 'attention') {
    if (item.reasons.includes('severe_score')) return Colors.primary.error;
    return Colors.primary.warning;
  }
  if (bucket === 'completed') return Colors.sway.bright;
  return Colors.chip.dotInactive;
};

type ScoreDeltaProps = {
  current: number;
  previous: number | null;
};

const ScoreDelta = ({ current, previous }: ScoreDeltaProps) => {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff === 0) {
    return (
      <ThemedText type="smallBold" style={{ color: Colors.sway.darkGrey }}>
        — 0
      </ThemedText>
    );
  }
  const isUp = diff > 0;
  return (
    <ThemedText type="smallBold" style={{ color: isUp ? Colors.primary.error : Colors.primary.success }}>
      {isUp ? '▲' : '▼'} {Math.abs(diff)}
    </ThemedText>
  );
};

type AssignmentDotsProps = {
  total: number;
  completed: number;
  overdue: number;
};

const MAX_DOTS = 6;

const DOT_STYLES = {
  done: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.sway.bright },
  overdue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.error,
    shadowColor: Colors.primary.error,
    shadowOffset: { width: 0, height: 0 } as const,
    shadowOpacity: 0.4,
    shadowRadius: 3
  },
  pending: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.chip.dotInactive }
} as const;

const getStatus = (i: number, completed: number, overdue: number): 'done' | 'overdue' | 'pending' => {
  if (i < completed) return 'done';
  if (i < completed + overdue) return 'overdue';
  return 'pending';
};

const AssignmentDots = ({ total, completed, overdue }: AssignmentDotsProps) => {
  const visible = Math.min(total, MAX_DOTS);
  const overflow = total - MAX_DOTS;

  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: visible }, (_, i) => (
        <View key={i} style={DOT_STYLES[getStatus(i, completed, overdue)]} />
      ))}
      {overflow > 0 && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          +{overflow}
        </ThemedText>
      )}
    </View>
  );
};

type ProgressBarProps = {
  completed: number;
  total: number;
};

const ProgressBar = ({ completed, total }: ProgressBarProps) => {
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View
      style={{
        width: 80,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.chip.darkCardDeep
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 2,
          backgroundColor: pct > 0 ? Colors.sway.bright : 'transparent'
        }}
      />
    </View>
  );
};

type ClientCardProps = {
  item: DashboardClientItem;
  bucket: BucketType;
};

const ClientCard = memo(({ item, bucket }: ClientCardProps) => {
  const borderColor = getLeftBorderColor(item, bucket);
  const { latestScore, previousScore, assignments } = item;
  const severity = getSeverityColors(latestScore?.scoreBandLabel);

  const displayName = item.patient.name || item.patient.username;

  return (
    <Link
      href={{
        pathname: '/(main)/(tabs)/patients/[id]',
        params: {
          id: item.patient._id,
          name: displayName,
          headerTitle: displayName
        }
      }}
      push
      withAnchor
      asChild
    >
      <Pressable
        className="mb-2.5 overflow-hidden rounded-[14] border-chip-dotInactive border-b-[1.5] bg-chip-pillPressed p-3.5 pb-3"
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      >
        {/* Top row: name + last active */}
        <View className="flex-row items-start justify-between">
          <ThemedText type="default" style={{ fontWeight: '700', fontSize: 16 }}>
            {displayName}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {item.lastActive ? formatRelativeTime(item.lastActive) : 'Never'}
          </ThemedText>
        </View>

        {/* Middle row: score badge + delta + assignment dots */}
        <View className="mt-2 flex-row items-center gap-3">
          {latestScore ? (
            <View
              className="flex-row items-center gap-1 rounded-lg px-2.5 py-1"
              style={{ backgroundColor: severity.pillBg }}
            >
              <ThemedText type="smallBold" style={{ color: severity.text }}>
                {latestScore.moduleTitle}: {latestScore.score}
              </ThemedText>
            </View>
          ) : (
            <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: Colors.tint.neutral }}>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                No scores
              </ThemedText>
            </View>
          )}
          {latestScore && <ScoreDelta current={latestScore.score} previous={previousScore?.score ?? null} />}
          <View className="ml-auto">
            <AssignmentDots total={assignments.total} completed={assignments.completed} overdue={assignments.overdue} />
          </View>
        </View>

        {/* Bottom row: completion text + progress bar */}
        <View className="mt-1.5 flex-row items-center justify-between">
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
              {assignments.completed}
            </ThemedText>
            /{assignments.total} completed
            {assignments.overdue > 0 && (
              <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
                {' '}
                · {assignments.overdue} overdue
              </ThemedText>
            )}
            {assignments.total > 0 && assignments.completed === assignments.total && ' ✓'}
          </ThemedText>
          <ProgressBar completed={assignments.completed} total={assignments.total} />
        </View>
      </Pressable>
    </Link>
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
