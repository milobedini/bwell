import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatRelativeTime } from '@/utils/dates';
import { getSeverityColors } from '@/utils/severity';
import type { DashboardAssignmentSummary, DashboardClientItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

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

const REASON_TAG_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  severe_score: {
    label: 'Severe',
    bg: Colors.tint.error,
    border: Colors.tint.errorBorder,
    text: Colors.primary.error
  },
  worsening: {
    label: 'Worsening',
    bg: Colors.tint.info,
    border: Colors.tint.infoBorder,
    text: Colors.primary.warning
  },
  overdue: {
    label: 'Overdue',
    bg: Colors.tint.info,
    border: Colors.tint.infoBorder,
    text: Colors.primary.warning
  }
};

type ReasonTagsProps = {
  reasons: DashboardClientItem['reasons'];
  bucket: BucketType;
};

const ReasonTags = ({ reasons, bucket }: ReasonTagsProps) => {
  if (bucket !== 'attention' || reasons.length === 0) return null;

  return (
    <>
      {reasons.map((reason) => {
        const config = REASON_TAG_CONFIG[reason];
        if (!config) {
          if (__DEV__) console.warn(`Unknown reason tag: ${reason}`);
          return null;
        }
        return (
          <View
            key={reason}
            style={{
              backgroundColor: config.bg,
              borderColor: config.border,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2
            }}
          >
            <ThemedText type="small" style={{ color: config.text, fontSize: 11, fontWeight: '600' }}>
              {config.label}
            </ThemedText>
          </View>
        );
      })}
    </>
  );
};

type AssignmentDotsProps = {
  completedThisWeek: number;
  overdueTotal: number;
  pendingThisWeek: number;
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

const getStatus = (i: number, completedThisWeek: number, overdueTotal: number): 'done' | 'overdue' | 'pending' => {
  if (i < completedThisWeek) return 'done';
  if (i < completedThisWeek + overdueTotal) return 'overdue';
  return 'pending';
};

const AssignmentDots = ({ completedThisWeek, overdueTotal, pendingThisWeek }: AssignmentDotsProps) => {
  const total = completedThisWeek + overdueTotal + pendingThisWeek;
  const visible = Math.min(total, MAX_DOTS);
  const overflow = total - MAX_DOTS;

  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: visible }, (_, i) => (
        <View key={i} style={DOT_STYLES[getStatus(i, completedThisWeek, overdueTotal)]} />
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
  completedThisWeek: number;
  total: number;
};

const ProgressBar = ({ completedThisWeek, total }: ProgressBarProps) => {
  const pct = total > 0 ? (completedThisWeek / total) * 100 : 0;

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

const CompletionText = ({ assignments }: { assignments: DashboardAssignmentSummary }) => {
  const { completedThisWeek, overdueTotal, pendingThisWeek } = assignments;
  const total = completedThisWeek + overdueTotal + pendingThisWeek;

  if (total === 0) {
    return (
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
        No assignments this week
      </ThemedText>
    );
  }

  const allDone = completedThisWeek > 0 && overdueTotal === 0 && pendingThisWeek === 0;

  const segments: { count: number; label: string }[] = [];
  if (completedThisWeek > 0) segments.push({ count: completedThisWeek, label: 'done' });
  if (overdueTotal > 0) segments.push({ count: overdueTotal, label: 'overdue' });
  if (pendingThisWeek > 0) segments.push({ count: pendingThisWeek, label: 'pending' });

  return (
    <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
      {segments.map((seg, i) => (
        <ThemedText key={seg.label} type="small" style={{ color: Colors.sway.darkGrey }}>
          {i > 0 && ' · '}
          <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
            {seg.count}
          </ThemedText>{' '}
          {seg.label}
        </ThemedText>
      ))}
      {allDone && ' ✓'}
    </ThemedText>
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
        <View className="flex-row items-start justify-between pr-5">
          <ThemedText type="default" style={{ fontWeight: '700', fontSize: 16 }}>
            {displayName}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {item.lastActive ? formatRelativeTime(item.lastActive) : 'Never'}
          </ThemedText>
        </View>

        {/* Middle row: score badge + delta + reason tags + assignment dots */}
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
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
          <ReasonTags reasons={item.reasons} bucket={bucket} />
          <View className="ml-auto">
            <AssignmentDots
              completedThisWeek={assignments.completedThisWeek}
              overdueTotal={assignments.overdueTotal}
              pendingThisWeek={assignments.pendingThisWeek}
            />
          </View>
        </View>

        {/* Bottom row: week-scoped completion text + progress bar */}
        <View className="mt-1.5 flex-row items-center justify-between">
          <CompletionText assignments={assignments} />
          <ProgressBar
            completedThisWeek={assignments.completedThisWeek}
            total={assignments.completedThisWeek + assignments.overdueTotal + assignments.pendingThisWeek}
          />
        </View>

        {/* Chevron disclosure indicator */}
        <View
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: [{ translateY: -9 }]
          }}
        >
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.chip.dotInactive} />
        </View>
      </Pressable>
    </Link>
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
