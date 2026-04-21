import { useState } from 'react';
import { useAdminVerifyTherapist } from '@/hooks/useUsers';
import type { AuthUser, TherapistTier } from '@milobedini/shared-types';

import ActionMenu from '../ui/ActionMenu';
import SearchPickerDialog from '../ui/SearchPickerDialog';

type TherapistPickerProps = {
  visible: boolean;
  onDismiss: () => void;
  therapists: AuthUser[];
};

const TherapistPicker = ({ visible, onDismiss, therapists }: TherapistPickerProps) => {
  const verifyTherapist = useAdminVerifyTherapist();
  const [pending, setPending] = useState<AuthUser | null>(null);

  const items = therapists.map((t) => ({
    ...t,
    title: t.name || t.username,
    subtitle: t.email,
    _id: t._id
  }));

  const handleSelect = (item: (typeof items)[number]) => {
    const original = therapists.find((t) => t._id === item._id);
    if (original) setPending(original);
  };

  const verifyAs = (tier: TherapistTier) => {
    if (!pending) return;
    verifyTherapist.mutate({ therapistId: pending._id, therapistTier: tier });
    setPending(null);
    onDismiss();
  };

  return (
    <>
      <SearchPickerDialog
        visible={visible && pending === null}
        onDismiss={onDismiss}
        items={items}
        isPending={verifyTherapist.isPending}
        isError={verifyTherapist.isError}
        title="Verify therapist"
        onSelect={handleSelect}
        rightIcon={() => 'account-plus'}
      />
      <ActionMenu
        visible={pending !== null}
        onDismiss={() => setPending(null)}
        title={pending ? `Verify ${pending.name || pending.username}` : 'Verify therapist'}
        subtitle="Choose their tier — governs which programmes they may deliver"
        actions={[
          {
            icon: 'brain',
            label: 'Verify as CBT therapist',
            onPress: () => verifyAs('cbt')
          },
          {
            icon: 'clipboard-pulse-outline',
            label: 'Verify as PWP practitioner',
            onPress: () => verifyAs('pwp')
          }
        ]}
      />
    </>
  );
};

export default TherapistPicker;
