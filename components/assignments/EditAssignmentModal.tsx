import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Portal, TextInput } from 'react-native-paper';
import { AnimatePresence, MotiView } from 'moti';
import { Colors } from '@/constants/Colors';
import { useUpdateAssignment } from '@/hooks/useAssignments';
import type { AssignmentRecurrence, MyAssignmentView } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import DueDateField from '../ui/DueDateField';
import RecurrenceField from '../ui/RecurrenceField';

type EditAssignmentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  assignment: MyAssignmentView | null;
};

const EditAssignmentModal = ({ visible, onDismiss, assignment }: EditAssignmentModalProps) => {
  const [dueAt, setDueAt] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<AssignmentRecurrence | undefined>(undefined);

  // Keep last assignment so AnimatePresence can render exit animation
  const lastAssignment = useRef<MyAssignmentView | null>(null);
  if (assignment) lastAssignment.current = assignment;
  const displayAssignment = assignment ?? lastAssignment.current;

  const { mutate: updateAssignment, isPending } = useUpdateAssignment();

  useEffect(() => {
    if (visible && assignment) {
      setDueAt(assignment.dueAt);
      setNotes(assignment.notes ?? '');
      setRecurrence(assignment.recurrence);
    }
  }, [visible, assignment]);

  const handleSave = useCallback(() => {
    if (!assignment) return;
    updateAssignment(
      {
        assignmentId: assignment._id,
        updates: {
          dueAt: dueAt ?? undefined,
          notes: notes || undefined,
          recurrence
        }
      },
      { onSuccess: onDismiss, onError: onDismiss }
    );
  }, [assignment, dueAt, notes, recurrence, updateAssignment, onDismiss]);

  if (!displayAssignment) return null;

  const patientName = displayAssignment.user.name ?? displayAssignment.user.username;

  return (
    <Portal>
      <AnimatePresence>
        {visible && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            style={StyleSheet.absoluteFill}
          >
            <Pressable onPress={onDismiss} className="flex-1" style={{ backgroundColor: Colors.overlay.medium }} />
          </MotiView>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <View style={styles.sheetContainer} pointerEvents="box-none">
            <MotiView
              from={{ translateY: 400, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="mx-4 mb-10 overflow-hidden rounded-2xl"
              style={{ backgroundColor: Colors.chip.darkCard, maxHeight: '80%' }}
            >
              {/* Header */}
              <View className="border-b px-5 pb-3 pt-5" style={{ borderBottomColor: Colors.chip.darkCardAlt }}>
                <ThemedText type="smallTitle" className="text-center">
                  Edit Assignment
                </ThemedText>
                <ThemedText type="small" className="mt-1 text-center" style={{ color: Colors.sway.darkGrey }}>
                  {displayAssignment.module.title} — {patientName}
                </ThemedText>
              </View>

              {/* Fields */}
              <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  <DueDateField value={dueAt} onChange={setDueAt} label="Due date" />

                  <View className="gap-1">
                    <ThemedText type="smallBold">Notes</ThemedText>
                    <TextInput
                      mode="outlined"
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Add therapist notes..."
                      multiline
                      numberOfLines={3}
                      style={{ backgroundColor: Colors.chip.darkCard }}
                    />
                  </View>

                  <RecurrenceField value={recurrence} onChange={setRecurrence} label="Recurrence" />
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                className="flex-row justify-end gap-2 border-t px-5 py-3"
                style={{ borderTopColor: Colors.chip.darkCardAlt }}
              >
                <Button onPress={onDismiss} mode="text" textColor={Colors.sway.darkGrey}>
                  Cancel
                </Button>
                <Button
                  onPress={handleSave}
                  mode="contained"
                  buttonColor={Colors.sway.bright}
                  textColor={Colors.primary.black}
                  loading={isPending}
                  disabled={isPending}
                >
                  Save
                </Button>
              </View>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </Portal>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end'
  }
});

export default EditAssignmentModal;
