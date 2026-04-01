import { useRouter } from 'expo-router';
import { useModules } from '@/hooks/useModules';
import type { AuthUser, Module } from '@milobedini/shared-types';

import SearchPickerDialog from '../ui/SearchPickerDialog';

type ModulePickerProps = {
  visible: boolean;
  onDismiss: () => void;
  patient: AuthUser;
};

const ModulePicker = ({ visible, onDismiss, patient }: ModulePickerProps) => {
  const router = useRouter();
  const { data: modules, isPending, isError } = useModules();

  const items = (modules ?? []).map((m) => ({
    ...m,
    title: m.title,
    subtitle: m.description,
    _id: m._id
  }));

  const handleSelect = (item: Module & { subtitle?: string }) => {
    const chosen = modules?.find((m) => m._id === item._id);
    if (!chosen) return;
    router.replace({
      pathname: '/patients/add',
      params: {
        client: JSON.stringify(patient),
        module: JSON.stringify(chosen),
        headerTitle: 'Create Assignment'
      }
    });
    onDismiss();
  };

  return (
    <SearchPickerDialog
      visible={visible}
      onDismiss={onDismiss}
      items={items}
      isPending={isPending}
      isError={isError}
      title={`Assign ${patient.name || patient.username}`}
      onSelect={handleSelect}
      rightIcon={() => 'plus-circle'}
    />
  );
};

export default ModulePicker;
