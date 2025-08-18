import { useMemo, useState } from 'react';
import { Divider } from 'react-native-paper';
import Container from '@/components/Container';
import SearchPickerDialog from '@/components/ui/SearchPickerDialog';
import SelectField from '@/components/ui/SelectField';
import { useModules } from '@/hooks/useModules';
import useToggle from '@/hooks/useToggle';
import { useClients } from '@/hooks/useUsers';
import type { AuthUser, Module } from '@milobedini/shared-types';

const AddAssignment = () => {
  // User and module select dialogs, dueAt date picker, notes, recurrence picker.
  //   @react-native-community/datetimepicker
  // ToggleButton for recurrence.
  // Notes interface for notes (see Sway). https://github.com/milobedini/sway-app/blob/main/navigators/learn/screens/notes/NotesScreen.tsx

  const [clientPickerVisible, toggleClientPickerVisible] = useToggle(false);
  const [client, setClient] = useState<AuthUser>();
  const [modulePickerVisible, toggleModulePickerVisible] = useToggle(false);
  const [module, setModule] = useState<Module>();
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
        subtitle: c.program.title,
        raw: c
      })),
    [modules]
  );

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
