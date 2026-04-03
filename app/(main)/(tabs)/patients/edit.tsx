import { useCallback, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import DueDateField from '@/components/ui/DueDateField';
import RecurrenceField from '@/components/ui/RecurrenceField';
import SelectField from '@/components/ui/SelectField';
import { Fonts } from '@/constants/Typography';
import { useUpdateAssignment } from '@/hooks/useAssignments';
import type { AssignmentRecurrence, UpdateAssignmentInput } from '@milobedini/shared-types';

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
  const [recurrence, setRecurrence] = useState<AssignmentRecurrence | undefined>(initialRecurrence ?? { freq: 'none' });
  const [notes, setNotes] = useState(params.notes ?? '');

  const router = useRouter();
  const updateAssignment = useUpdateAssignment();

  const hasChanges = useMemo(() => {
    const dueAtChanged = (dueAt ?? '') !== (params.dueAt ?? '');
    const notesChanged = notes !== (params.notes ?? '');
    const recurrenceChanged = JSON.stringify(recurrence) !== JSON.stringify(initialRecurrence ?? { freq: 'none' });
    return dueAtChanged || notesChanged || recurrenceChanged;
  }, [dueAt, params.dueAt, notes, params.notes, recurrence, initialRecurrence]);

  const handleSubmit = useCallback(() => {
    const updates: UpdateAssignmentInput = {};
    if ((dueAt ?? '') !== (params.dueAt ?? '')) updates.dueAt = dueAt;
    if (notes !== (params.notes ?? '')) updates.notes = notes;
    if (JSON.stringify(recurrence) !== JSON.stringify(initialRecurrence ?? { freq: 'none' })) {
      updates.recurrence = recurrence;
    }

    updateAssignment.mutate({ assignmentId: params.assignmentId!, updates }, { onSuccess: () => router.back() });
  }, [dueAt, recurrence, notes, params, initialRecurrence, updateAssignment, router]);

  return (
    <ContentContainer>
      {/* Client (read-only) */}
      <SelectField
        label={params.patientName ?? 'Patient'}
        value={params.patientName}
        selected
        leftIcon="check-circle"
        onPress={() => {}}
        disabled
      />
      <Divider />

      {/* Module (read-only) */}
      <SelectField
        label={params.moduleTitle ?? 'Module'}
        value={params.moduleTitle}
        placeholder={`${params.programTitle ?? ''} (${params.moduleType ?? ''})`}
        selected
        leftIcon="check-circle"
        onPress={() => {}}
        disabled
      />
      <Divider />

      {/* Due date (editable) */}
      <DueDateField value={dueAt} onChange={setDueAt} label="Due date" />
      <Divider />

      {/* Recurrence (editable, shown when due date set) */}
      {dueAt && (
        <>
          <RecurrenceField value={recurrence} onChange={setRecurrence} label="Recurrence" />
          <Divider />
        </>
      )}

      {/* Notes (editable) */}
      <TextInput
        autoCapitalize="sentences"
        autoCorrect={true}
        clearButtonMode="while-editing"
        placeholder="Notes for your client (optional)..."
        returnKeyType="done"
        value={notes}
        onChangeText={setNotes}
        className="h-[64px] px-3 text-white"
        placeholderTextColor={'white'}
        style={{ fontFamily: Fonts.Regular }}
      />
      <Divider />

      {/* Buttons */}
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
