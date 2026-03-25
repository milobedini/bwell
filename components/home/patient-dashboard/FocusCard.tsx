import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { dueLabel } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';

type FocusCardProps = {
  assignment: MyAssignmentView | null;
};

const getUrgency = (assignment: MyAssignmentView) => {
  if (!assignment.dueAt) return 'future' as const;
  const now = new Date();
  const due = new Date(assignment.dueAt);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return 'overdue' as const;
  if (diffDays <= 1) return 'soon' as const;
  return 'future' as const;
};

const URGENCY_STYLES = {
  overdue: {
    bg: Colors.tint.error,
    border: 'rgba(255,109,94,0.3)',
    label: 'OVERDUE',
    labelColor: Colors.primary.error,
    ctaBg: Colors.primary.error
  },
  soon: {
    bg: Colors.tint.teal,
    border: 'rgba(24,205,186,0.3)',
    label: 'YOUR FOCUS THIS WEEK',
    labelColor: Colors.sway.bright,
    ctaBg: Colors.sway.bright
  },
  future: {
    bg: Colors.tint.teal,
    border: 'rgba(24,205,186,0.15)',
    label: 'YOUR FOCUS THIS WEEK',
    labelColor: Colors.sway.bright,
    ctaBg: Colors.sway.bright
  }
} as const;

const FocusCard = memo(({ assignment }: FocusCardProps) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (!assignment) {
      router.push('/(main)/(tabs)/programs');
      return;
    }
    // If there's an in-progress draft, navigate directly to that attempt
    if (assignment.latestAttempt && !assignment.latestAttempt.completedAt) {
      router.push({
        pathname: '/(main)/(tabs)/attempts/[id]',
        params: { id: assignment.latestAttempt._id, assignmentId: assignment._id }
      });
      return;
    }
    // Otherwise navigate to assignments tab where they can start
    router.push('/(main)/(tabs)/assignments');
  }, [assignment, router]);

  // "All caught up" state
  if (!assignment) {
    return (
      <Pressable
        onPress={handlePress}
        style={{
          backgroundColor: Colors.tint.teal,
          borderWidth: 1.5,
          borderColor: 'rgba(24,205,186,0.15)',
          borderRadius: 16,
          padding: 18,
          marginBottom: 16
        }}
      >
        <ThemedText
          type="smallBold"
          style={{
            color: Colors.sway.bright,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: 11,
            marginBottom: 8
          }}
        >
          ALL CAUGHT UP
        </ThemedText>
        <ThemedText type="smallTitle" style={{ marginBottom: 4 }}>
          You&apos;re up to date
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          Explore programs or review your past work
        </ThemedText>
      </Pressable>
    );
  }

  const urgency = getUrgency(assignment);
  const styles = URGENCY_STYLES[urgency];
  const hasDraft = assignment.latestAttempt && !assignment.latestAttempt.completedAt;
  const ctaText = hasDraft ? 'Continue where you left off →' : 'Start →';

  return (
    <View
      style={{
        backgroundColor: styles.bg,
        borderWidth: 1.5,
        borderColor: styles.border,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16
      }}
    >
      <ThemedText
        type="smallBold"
        style={{
          color: styles.labelColor,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: 11,
          marginBottom: 8
        }}
      >
        {urgency === 'overdue' ? '⚠ ' : ''}
        {styles.label}
      </ThemedText>
      <ThemedText type="smallTitle" style={{ marginBottom: 4 }}>
        {assignment.module.title}
      </ThemedText>
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 14 }}>
        {assignment.dueAt ? dueLabel(assignment.dueAt) : 'No due date'}
        {assignment.therapist?.name ? ` · From ${assignment.therapist.name}` : ''}
      </ThemedText>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          backgroundColor: styles.ctaBg,
          borderRadius: 12,
          padding: 12,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1
        })}
      >
        <ThemedText type="smallBold" style={{ color: Colors.sway.dark, fontSize: 15 }}>
          {ctaText}
        </ThemedText>
      </Pressable>
    </View>
  );
});

FocusCard.displayName = 'FocusCard';

export default FocusCard;
