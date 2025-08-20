import { useCallback, useMemo, useState } from 'react';
import { TextInput } from 'react-native';
import { Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ThemedButton from '@/components/ThemedButton';
import { renderErrorToast, renderSuccessToast } from '@/components/toast/toastOptions';
import DueDateField from '@/components/ui/DueDateField';
import RecurrenceField from '@/components/ui/RecurrenceField';
import SearchPickerDialog from '@/components/ui/SearchPickerDialog';
import SelectField from '@/components/ui/SelectField';
import { Fonts } from '@/constants/Typography';
import { useCreateAssignment } from '@/hooks/useAssignments';
import { useModules } from '@/hooks/useModules';
import useToggle from '@/hooks/useToggle';
import { useClients } from '@/hooks/useUsers';
import type { AssignmentRecurrence, AuthUser, CreateAssignmentInput, Module } from '@milobedini/shared-types';

const AddAssignment = () => {
  // User and module select dialogs, dueAt date picker, notes, recurrence picker.
  //   @react-native-community/datetimepicker
  // ToggleButton for recurrence.
  // Notes interface for notes (see Sway). https://github.com/milobedini/sway-app/blob/main/navigators/learn/screens/notes/NotesScreen.tsx

  const [clientPickerVisible, toggleClientPickerVisible] = useToggle(false);
  const [client, setClient] = useState<AuthUser>();
  const [modulePickerVisible, toggleModulePickerVisible] = useToggle(false);
  const [module, setModule] = useState<Module>();
  const [dueAt, setDueAt] = useState<string | undefined>();
  const [recurrence, setRecurrence] = useState<AssignmentRecurrence | undefined>({ freq: 'none' });
  const [notes, setNotes] = useState('');

  const router = useRouter();
  const createAssignment = useCreateAssignment();
  const { isPending: createPending } = createAssignment;
  const { data: clients, isPending: clientsPending, isError: clientsError } = useClients();
  const { data: modules, isPaused: modulesPending, isError: modulesError } = useModules();

  const clientItems = useMemo(
    () =>
      (clients || []).map((c) => ({
        _id: c._id,
        title: c.name || c.username,
        subtitle: c.email,
        raw: c
      })),
    [clients]
  );
  const moduleItems = useMemo(
    () =>
      (modules || []).map((c) => ({
        _id: c._id,
        title: c.title,
        subtitle: `${c.program.title} (${c.type})`,
        raw: c
      })),
    [modules]
  );

  const input: CreateAssignmentInput = useMemo(() => {
    return {
      userId: client?._id || '',
      moduleId: module?._id || '',
      dueAt,
      recurrence,
      notes
    };
  }, [client?._id, module?._id, dueAt, recurrence, notes]);

  const handleSubmit = useCallback(() => {
    createAssignment.mutate(input, {
      onSuccess: () => {
        renderSuccessToast('Created assignment');
        router.navigate('/(main)/(tabs)/assignments');
      },
      onError: (err) => renderErrorToast(err)
    });
  }, [createAssignment, input, router]);

  return (
    <Container>
      {/* Inputs */}
      <SelectField
        label="Client"
        value={client?.name || client?.username}
        placeholder="Choose a client"
        selected={!!client?._id}
        leftIcon="account-circle-outline"
        onPress={() => toggleClientPickerVisible()}
        onClear={() => setClient(undefined)}
      />
      <Divider />
      <SelectField
        label="Module"
        value={module?.title}
        placeholder="Choose a module"
        selected={!!module?._id}
        leftIcon="book-open-page-variant-outline"
        onPress={() => toggleModulePickerVisible()}
        onClear={() => setModule(undefined)}
      />
      <Divider />
      <DueDateField value={dueAt} onChange={setDueAt} label="Due date" />
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
        returnKeyType="send"
        onSubmitEditing={() => {}}
        value={notes}
        onChangeText={setNotes}
        className="h-[64px] px-3 text-white"
        placeholderTextColor={'white'}
        style={{ fontFamily: Fonts.Regular }}
      />
      <Divider />
      <ThemedButton
        title={createPending ? 'Creating...' : 'Create'}
        onPress={handleSubmit}
        compact
        className="mt-2 w-[200] self-center"
        disabled={!client?._id || !module?._id}
      />

      {/* Dialogs */}
      <SearchPickerDialog
        visible={clientPickerVisible}
        onDismiss={() => toggleClientPickerVisible()}
        items={clientItems}
        isPending={clientsPending}
        isError={clientsError}
        title="Clients"
        onSelect={(item) => setClient(item.raw)}
        leftIcon={() => 'account'}
      />
      <SearchPickerDialog
        visible={modulePickerVisible}
        onDismiss={() => toggleModulePickerVisible()}
        items={moduleItems}
        isPending={modulesPending}
        isError={modulesError}
        title="Modules"
        onSelect={(item) => setModule(item.raw)}
        leftIcon={() => 'book-open-page-variant'}
      />
    </Container>
  );
};

export default AddAssignment;
