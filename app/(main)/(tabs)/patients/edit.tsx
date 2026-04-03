import { useCallback, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import DueDateField from '@/components/ui/DueDateField';
import RecurrenceField from '@/components/ui/RecurrenceField';
import SelectField from '@/components/ui/SelectField';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useUpdateAssignment } from '@/hooks/useAssignments';
import type { AssignmentRecurrence, UpdateAssignmentInput } from '@milobedini/shared-types';

const NO_RECURRENCE: AssignmentRecurrence = { freq: 'none' };

const EditAssignment = () => {
  const params = useLocalSearchParams<{
    assignmentId: string;
    patientName: string;
    moduleTitle: string;
    programTitle: string;
    moduleType: string;
    dueAt?: string;
    recurrence?: string;
    notes?: string;
    headerTitle?: string;
  }>();

  const initialRecurrence = useMemo<AssignmentRecurrence | undefined>(
    () => (params.recurrence ? (JSON.parse(params.recurrence) as AssignmentRecurrence) : undefined),
    [params.recurrence]
  );

  const [dueAt, setDueAt] = useState<string | undefined>(params.dueAt);
  const [recurrence, setRecurrence] = useState<AssignmentRecurrence | undefined>(initialRecurrence ?? NO_RECURRENCE);

  const handleDueAtChange = useCallback((val?: string) => {
    setDueAt(val);
    if (!val) setRecurrence(NO_RECURRENCE);
  }, []);
  const [notes, setNotes] = useState(params.notes ?? '');

  const router = useRouter();
  const updateAssignment = useUpdateAssignment();
  const { assignmentId, dueAt: initialDueAt, notes: initialNotes } = params;

  const buildUpdates = useCallback((): UpdateAssignmentInput => {
    const updates: UpdateAssignmentInput = {};
    if ((dueAt ?? '') !== (initialDueAt ?? '')) {
      updates.dueAt = dueAt ?? null;
    }
    if (notes !== (initialNotes ?? '')) updates.notes = notes;
    if (JSON.stringify(recurrence) !== JSON.stringify(initialRecurrence ?? NO_RECURRENCE)) {
      updates.recurrence = recurrence ?? NO_RECURRENCE;
    }
    return updates;
  }, [dueAt, initialDueAt, notes, initialNotes, recurrence, initialRecurrence]);

  const hasChanges = useMemo(() => Object.keys(buildUpdates()).length > 0, [buildUpdates]);

  const handleSubmit = useCallback(() => {
    const updates = buildUpdates();
    updateAssignment.mutate({ assignmentId: assignmentId!, updates }, { onSuccess: () => router.back() });
  }, [buildUpdates, assignmentId, updateAssignment, router]);

  return (
    <ContentContainer>
      <SelectField
        label={params.patientName ?? 'Patient'}
        value={params.patientName}
        selected
        leftIcon="check-circle"
        disabled
      />
      <Divider />

      <SelectField
        label={params.moduleTitle ?? 'Module'}
        value={params.moduleTitle}
        placeholder={`${params.programTitle ?? ''} (${params.moduleType ?? ''})`}
        selected
        leftIcon="check-circle"
        disabled
      />
      <Divider />

      <DueDateField value={dueAt} onChange={handleDueAtChange} label="Due date" />
      <Divider />

      {dueAt && (
        <>
          <RecurrenceField value={recurrence} onChange={setRecurrence} label="Recurrence" />
          <Divider />
        </>
      )}

      <TextInput
        autoCapitalize="sentences"
        autoCorrect={true}
        clearButtonMode="while-editing"
        placeholder="Notes for your client (optional)..."
        returnKeyType="done"
        value={notes}
        onChangeText={setNotes}
        className="h-[64px] px-3 text-white"
        placeholderTextColor={Colors.sway.darkGrey}
        style={{ fontFamily: Fonts.Regular }}
      />
      <Divider />

      <View className="mt-4 gap-4">
        <ThemedButton
          title={updateAssignment.isPending ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          compact
          centered
          disabled={!hasChanges || updateAssignment.isPending}
        />
        <ThemedButton title="Cancel" compact variant="error" centered onPress={() => router.back()} />
      </View>
    </ContentContainer>
  );
};

export default EditAssignment;
