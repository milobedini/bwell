import { useAdminVerifyTherapist } from '@/hooks/useUsers';
import type { AuthUser } from '@milobedini/shared-types';

import SearchPickerDialog from '../ui/SearchPickerDialog';

type TherapistPickerProps = {
  visible: boolean;
  onDismiss: () => void;
  therapists: AuthUser[];
};

const TherapistPicker = ({ visible, onDismiss, therapists }: TherapistPickerProps) => {
  const verifyTherapist = useAdminVerifyTherapist();

  const items = therapists.map((t) => ({
    ...t,
    title: t.name || t.username,
    subtitle: t.email,
    _id: t._id
  }));

  const handleSelect = (item: (typeof items)[number]) => {
    verifyTherapist.mutate({ therapistId: item._id });
  };

  return (
    <SearchPickerDialog
      visible={visible}
      onDismiss={onDismiss}
      items={items}
      isPending={verifyTherapist.isPending}
      isError={verifyTherapist.isError}
      title="Verify therapist"
      onSelect={handleSelect}
      rightIcon={() => 'account-plus'}
    />
  );
};

export default TherapistPicker;
