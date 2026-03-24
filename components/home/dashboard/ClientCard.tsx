import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatRelativeTime } from '@/utils/dates';
import { DashboardClientItem } from '@milobedini/shared-types';

const getLeftBorderColor = (item: DashboardClientItem): string => {
  if (item.reasons.includes('severe_score')) return Colors.primary.error;
  if (item.reasons.includes('worsening') || item.reasons.includes('overdue')) return Colors.primary.warning;
  if (item.assignments.completed > 0 && item.reasons.length === 0) return Colors.sway.bright;
  return Colors.chip.dotInactive;
};

const getScoreBadgeStyle = (band: string) => {
  const lower = band.toLowerCase();
  if (lower.includes('severe')) return { bg: Colors.tint.error, text: Colors.primary.error };
  if (lower.includes('moderate')) return { bg: Colors.tint.info, text: Colors.primary.warning };
  if (lower.includes('mild')) return { bg: Colors.tint.teal, text: Colors.sway.bright };
  return { bg: Colors.tint.neutral, text: Colors.sway.darkGrey };
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

const AssignmentDots = ({ total, completed, overdue }: AssignmentDotsProps) => {
  const allDots = [
    ...Array.from({ length: completed }, () => 'done' as const),
    ...Array.from({ length: overdue }, () => 'overdue' as const),
    ...Array.from({ length: Math.max(0, total - completed - overdue) }, () => 'pending' as const)
  ];

  const visibleDots = allDots.slice(0, MAX_DOTS);
  const overflow = allDots.length - MAX_DOTS;

  return (
    <View className="flex-row items-center gap-1.5">
      {visibleDots.map((status, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor:
              status === 'done'
                ? Colors.sway.bright
                : status === 'overdue'
                  ? Colors.primary.error
                  : Colors.chip.dotInactive,
            ...(status === 'overdue' && {
              shadowColor: Colors.primary.error,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 3
            })
          }}
        />
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
};

const ClientCard = memo(({ item }: ClientCardProps) => {
  const router = useRouter();
  const borderColor = getLeftBorderColor(item);
  const { latestScore, previousScore, assignments } = item;
  const scoreBadge = latestScore ? getScoreBadgeStyle(latestScore.scoreBandLabel) : null;

  const displayName = item.patient.name || item.patient.username;

  return (
    <Pressable
      onPress={() => router.push(`/home/clients/${item.patient._id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.chip.darkCardAlt : Colors.chip.darkCard,
        borderRadius: 14,
        padding: 14,
        paddingBottom: 12,
        marginBottom: 10,
        borderLeftWidth: 3.5,
        borderLeftColor: borderColor,
        borderWidth: 1,
        borderColor: Colors.chip.dotInactive
      })}
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
        {latestScore && scoreBadge ? (
          <View
            style={{
              backgroundColor: scoreBadge.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}
          >
            <ThemedText type="smallBold" style={{ color: scoreBadge.text }}>
              {latestScore.moduleTitle}: {latestScore.score}
            </ThemedText>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: Colors.tint.neutral,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8
            }}
          >
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
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
