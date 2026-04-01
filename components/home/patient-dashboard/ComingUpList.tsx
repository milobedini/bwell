import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { dueLabel } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';

type ComingUpListProps = {
  assignments: MyAssignmentView[];
  hasMore: boolean;
  remainingCount: number;
};

const AssignmentRow = memo(({ assignment }: { assignment: MyAssignmentView }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    // If there's an in-progress draft, navigate to that attempt
    if (assignment.latestAttempt && !assignment.latestAttempt.completedAt) {
      router.push({
        pathname: '/(main)/(tabs)/journey/[id]',
        params: { id: assignment.latestAttempt._id, assignmentId: assignment._id }
      });
      return;
    }
    // Otherwise go to practice tab
    router.push('/(main)/(tabs)/practice');
  }, [assignment, router]);

  const label = assignment.dueAt ? dueLabel(assignment.dueAt) : 'No due date';
  const hasDraft = assignment.latestAttempt && !assignment.latestAttempt.completedAt;

  return (
    <Pressable
      onPress={handlePress}
      className="mb-2 flex-row items-center justify-between rounded-[14px] bg-chip-darkCard px-4 py-3.5 active:bg-chip-pillPressed"
    >
      <View className="mr-3 flex-1">
        <ThemedText type="default" style={{ fontWeight: '600', fontSize: 15 }}>
          {assignment.module.title}
        </ThemedText>
        <ThemedText type="small" className="mt-0.5" style={{ color: Colors.sway.darkGrey }}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600', fontSize: 13 }}>
        {hasDraft ? 'Continue →' : 'Start →'}
      </ThemedText>
    </Pressable>
  );
});

AssignmentRow.displayName = 'AssignmentRow';

const ComingUpList = memo(({ assignments, hasMore, remainingCount }: ComingUpListProps) => {
  const router = useRouter();

  const goToAssignments = useCallback(() => {
    router.push('/(main)/(tabs)/practice');
  }, [router]);

  if (assignments.length === 0) return null;

  return (
    <View className="mb-5">
      <ThemedText
        type="smallBold"
        style={{
          color: Colors.sway.darkGrey,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: 12,
          marginBottom: 10
        }}
      >
        Coming Up
      </ThemedText>
      {assignments.map((a) => (
        <AssignmentRow key={a._id} assignment={a} />
      ))}
      {hasMore && (
        <>
          <View className="items-end pr-1 pt-0.5">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
              +{remainingCount} more
            </ThemedText>
          </View>
          <Pressable onPress={goToAssignments} className="items-center py-1.5">
            <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600' }}>
              View all assignments →
            </ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );
});

ComingUpList.displayName = 'ComingUpList';

export default ComingUpList;
