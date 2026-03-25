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
};

const AssignmentRow = memo(({ assignment }: { assignment: MyAssignmentView }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    const moduleId = assignment.module._id;
    const assignmentId = assignment._id;
    router.push(`/(main)/modules/${moduleId}?assignmentId=${assignmentId}`);
  }, [assignment, router]);

  const label = assignment.dueAt ? dueLabel(assignment.dueAt) : 'No due date';
  const isDueSoon = assignment.dueAt
    ? Math.round((new Date(assignment.dueAt).getTime() - Date.now()) / 86_400_000) <= 1
    : false;

  return (
    <Pressable
      onPress={handlePress}
      className="mb-2 flex-row items-center justify-between rounded-[14px] px-4 py-3.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.chip.pillPressed : Colors.chip.darkCard
      })}
    >
      <View className="mr-3 flex-1">
        <ThemedText type="default" style={{ fontWeight: '600', fontSize: 15 }}>
          {assignment.module.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 3 }}>
          {label}
        </ThemedText>
      </View>
      {isDueSoon && (
        <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600', fontSize: 13 }}>
          Start →
        </ThemedText>
      )}
      {!isDueSoon && assignment.dueAt && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 13 }}>
          {Math.max(0, Math.round((new Date(assignment.dueAt).getTime() - Date.now()) / 86_400_000))} days
        </ThemedText>
      )}
    </Pressable>
  );
});

AssignmentRow.displayName = 'AssignmentRow';

const ComingUpList = memo(({ assignments, hasMore }: ComingUpListProps) => {
  const router = useRouter();

  const goToAssignments = useCallback(() => {
    router.push('/(main)/(tabs)/assignments');
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
        <Pressable onPress={goToAssignments} className="items-center py-1.5">
          <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600' }}>
            View all assignments →
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
});

ComingUpList.displayName = 'ComingUpList';

export default ComingUpList;
