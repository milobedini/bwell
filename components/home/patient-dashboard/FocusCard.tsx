import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { dueLabel } from '@/utils/dates';
import type { PracticeItem } from '@milobedini/shared-types';

type FocusCardProps = {
  assignment: PracticeItem | null;
};

const getUrgency = (assignment: PracticeItem) => {
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
    border: Colors.tint.errorBorder,
    label: 'OVERDUE',
    labelColor: Colors.primary.error,
    ctaBg: Colors.primary.error
  },
  soon: {
    bg: Colors.tint.teal,
    border: Colors.tint.tealBorder,
    label: 'YOUR FOCUS THIS WEEK',
    labelColor: Colors.sway.bright,
    ctaBg: Colors.sway.bright
  },
  future: {
    bg: Colors.tint.teal,
    border: Colors.tint.teal,
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
    router.push({
      pathname: '/(main)/(tabs)/home/practice/[id]',
      params: { id: assignment.assignmentId, headerTitle: assignment.moduleTitle }
    });
  }, [assignment, router]);

  // "All caught up" state
  if (!assignment) {
    return (
      <Pressable
        onPress={handlePress}
        className="mb-4 rounded-2xl border-[1.5px] p-[18px]"
        style={{ backgroundColor: Colors.tint.teal, borderColor: Colors.tint.teal }}
      >
        <ThemedText
          type="smallBold"
          style={{ color: Colors.sway.bright, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11 }}
          className="mb-2"
        >
          ALL CAUGHT UP
        </ThemedText>
        <ThemedText type="smallTitle" className="mb-1">
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
      className="mb-4 rounded-2xl border-[1.5px] p-[18px]"
      style={{ backgroundColor: styles.bg, borderColor: styles.border }}
    >
      <ThemedText
        type="smallBold"
        style={{ color: styles.labelColor, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11 }}
        className="mb-2"
      >
        {urgency === 'overdue' ? '⚠ ' : ''}
        {styles.label}
      </ThemedText>
      <ThemedText type="smallTitle" className="mb-1">
        {assignment.moduleTitle}
      </ThemedText>
      <ThemedText type="small" className="mb-3.5" style={{ color: Colors.sway.darkGrey }}>
        {assignment.dueAt ? dueLabel(assignment.dueAt) : 'No due date'}
        {assignment.therapistName ? ` · From ${assignment.therapistName}` : ''}
      </ThemedText>
      <Pressable
        onPress={handlePress}
        className="items-center rounded-xl p-3 active:opacity-85"
        style={{ backgroundColor: styles.ctaBg }}
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
