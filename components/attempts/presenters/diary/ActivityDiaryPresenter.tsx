import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Chip, Divider } from 'react-native-paper';
import { PrimaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailResponseItem, DiaryEntryInput } from '@milobedini/shared-types';

type Props = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  saveDiary?(entries: DiaryEntryInput[], merge?: boolean): Promise<void>;
  submitAttempt?(args?: { assignmentId?: string }): Promise<void>;
  isSaving?: boolean;
  saved?: boolean;
  patientName?: string;
};

export default function ActivityDiaryPresenter({ attempt, mode, submitAttempt, patientName }: Props) {
  const title = attempt.moduleSnapshot?.title ?? 'Activity Diary';

  const headerRight = useMemo(() => {
    if (mode === 'view' && attempt.completedAt) {
      return (
        <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
          Completed {new Date(attempt.completedAt).toLocaleDateString()}
        </Chip>
      );
    }
    if (mode === 'edit' && attempt.startedAt) {
      return (
        <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
          In progress • {new Date(attempt.startedAt).toLocaleDateString()}
        </Chip>
      );
    }
    return null;
  }, [mode, attempt.completedAt, attempt.startedAt]);

  return (
    <ScrollView className="flex-1">
      {/* Header */}
      <View className="gap-2 px-4 pt-1">
        <ThemedText type="title">
          {title}
          {patientName && ` by ${patientName}`}
        </ThemedText>
        {attempt.moduleSnapshot?.disclaimer && <ThemedText>{attempt.moduleSnapshot.disclaimer}</ThemedText>}
        <View className="flex-row flex-wrap items-center gap-2">{headerRight}</View>
        <Card style={{ backgroundColor: Colors.sway.buttonBackground, marginTop: 8 }}>
          <Card.Content>
            <ThemedText className="opacity-90">
              Placeholder UI for Activity Diary. Build your grid/rows for time slots here and call{' '}
              <ThemedText type="link">saveDiary(entries, true)</ThemedText> as users edit.
            </ThemedText>
          </Card.Content>
        </Card>
      </View>

      <Divider className="my-4" bold />

      {/* TODO: diary grid/list goes here */}

      {mode === 'edit' && (
        <View className="p-4 pt-2">
          <PrimaryButton onPress={() => submitAttempt?.()} title="Submit diary" />
        </View>
      )}
    </ScrollView>
  );
}
