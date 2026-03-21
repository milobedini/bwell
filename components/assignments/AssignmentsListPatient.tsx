import { memo, useCallback } from 'react';
import { FlatList, type ListRenderItemInfo, View } from 'react-native';
import { clsx } from 'clsx';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useStartModuleAttempt } from '@/hooks/useAttempts';
import { AssignmentStatus } from '@/types/types';
import { dateString } from '@/utils/dates';
import { MyAssignmentView } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { AssignmentStatusChip, DueChip, RecurrenceChip, StatusChip, TimeLeftChip } from '../ui/Chip';

type AssignmentListItemPatientProps = {
  item: MyAssignmentView;
  index: number;
  completed?: boolean;
  onStart: (assignment: MyAssignmentView) => void;
};

const AssignmentListItemPatientBase = ({ item, index, completed, onStart }: AssignmentListItemPatientProps) => {
  const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
  const isInProgress = item.status === AssignmentStatus.IN_PROGRESS;

  return (
    <View className={clsx('gap-1 p-4', bgColor)}>
      <View className="flex-row items-center gap-2">
        <ThemedText type="smallTitle">{item.module.title}</ThemedText>
        {isInProgress && <AssignmentStatusChip status={item.status as AssignmentStatus} />}
        {isInProgress && item.percentComplete !== undefined && (
          <StatusChip
            label={`${Math.round(item.percentComplete)}%`}
            color={Colors.chip.amber}
            borderColor={Colors.chip.amberBorder}
            icon="progress-clock"
          />
        )}
      </View>
      <ThemedText>Assigned by {item.therapist.name}</ThemedText>
      {item.notes && <ThemedText type="italic">&quot;{item.notes}&quot;</ThemedText>}
      {item.recurrence && completed && <RecurrenceChip recurrence={item.recurrence} />}
      {completed && <DueChip completed dueAt={item.latestAttempt?.completedAt} />}
      {completed && (
        <Link
          asChild
          href={{
            pathname: '/attempts/[id]',
            params: {
              id: item.latestAttempt?._id as string,
              assignmentId: item._id,
              headerTitle: `${item.module.title} (${dateString(item.updatedAt)})`
            }
          }}
          withAnchor
        >
          <ThemedButton title={'View attempt'} compact className="mt-4 self-start" />
        </Link>
      )}
      {!completed && (
        <View>
          <View className="flex-row flex-wrap gap-1">
            <DueChip dueAt={item.dueAt} />
            {item.dueAt && <TimeLeftChip dueAt={item.dueAt} />}
            {item.recurrence && !completed && <RecurrenceChip recurrence={item.recurrence} />}
          </View>
          {isInProgress ? (
            <Link
              asChild
              withAnchor
              href={{
                pathname: '/attempts/[id]',
                params: {
                  id: item.latestAttempt?._id as string,
                  assignmentId: item._id,
                  headerTitle: item.module.title
                }
              }}
            >
              <ThemedButton title="Continue" compact className="mt-4 w-1/3" />
            </Link>
          ) : (
            <ThemedButton title="Start" compact className="mt-4 w-1/3" onPress={() => onStart(item)} />
          )}
        </View>
      )}
    </View>
  );
};

const AssignmentListItemPatient = memo(AssignmentListItemPatientBase);

type AssignmentsListPatientProps = {
  data: MyAssignmentView[];
  completed?: boolean;
};

const AssignmentsListPatient = ({ data, completed }: AssignmentsListPatientProps) => {
  const router = useRouter();
  const { mutate: startAttempt } = useStartModuleAttempt();

  const createAttemptFromAssignment = useCallback(
    (assignment: MyAssignmentView) => {
      startAttempt(
        { moduleId: assignment.module._id, assignmentId: assignment._id },
        {
          onSuccess: (res) =>
            router.push({
              pathname: '/(main)/(tabs)/attempts/[id]',
              params: {
                id: res.attempt._id,
                assignmentId: assignment._id
              }
            })
        }
      );
    },
    [router, startAttempt]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<MyAssignmentView>) => (
      <AssignmentListItemPatient
        item={item}
        index={index}
        completed={completed}
        onStart={createAttemptFromAssignment}
      />
    ),
    [completed, createAttemptFromAssignment]
  );

  return <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} />;
};

export default AssignmentsListPatient;
