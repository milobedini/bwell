import { useCallback } from 'react';
import { renderErrorToast, renderSuccessToast } from '@/components/toast/toastOptions';
import { useAddRemoveTherapist } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { getServerErrorMessage } from '@/utils/axiosErrorString';
import type { AuthUser, User } from '@milobedini/shared-types';

import { FabGroupAction } from './FabGroup';

enum FabOptionsVariant {
  PATIENTS = 'patients',
  CLIENTS = 'clients'
}

type FabOptionsProps = {
  variant?: FabOptionsVariant;
  closeMenu: () => void;
  selectedEntity?: User | AuthUser;
  isClient?: boolean;
  openModulePicker?: (patentId: string) => void;
};

const useGetFabOptions = ({
  variant,
  closeMenu,
  selectedEntity,
  isClient,
  openModulePicker
}: FabOptionsProps): FabGroupAction[] => {
  const user = useAuthStore((s) => s.user);
  const addRemoveTherapist = useAddRemoveTherapist();

  const handleAddRemoveTherapist = useCallback(() => {
    if (selectedEntity?._id && user?._id) {
      addRemoveTherapist.mutate(
        { patientId: selectedEntity._id, therapistId: user._id },
        {
          onSuccess: (data) => {
            renderSuccessToast(data.message);
            closeMenu();
          },
          onError: (err) => {
            renderErrorToast(getServerErrorMessage(err));
            closeMenu();
          }
        }
      );
    }
  }, [addRemoveTherapist, closeMenu, selectedEntity?._id, user?._id]);

  switch (variant) {
    case FabOptionsVariant.PATIENTS:
      return [
        {
          icon: 'star',
          label: isClient ? 'Remove as client' : 'Add as client',
          labelTextColor: 'white',
          // color: 'gold',
          style: { backgroundColor: 'white' },
          onPress: handleAddRemoveTherapist
        },
        {
          icon: 'email',
          label: 'Email patient',
          labelTextColor: 'white',
          style: { backgroundColor: 'white' },
          onPress: () => {
            closeMenu();
          }
        }
      ];
    case FabOptionsVariant.CLIENTS:
      return [
        {
          icon: 'account-off',
          label: 'Remove as client',
          labelTextColor: 'white',
          // color: 'gold',
          style: { backgroundColor: 'white' },
          onPress: handleAddRemoveTherapist
        },
        {
          icon: 'book-plus',
          label: 'Manage modules',
          labelTextColor: 'white',
          style: { backgroundColor: 'white' },
          onPress: () => {
            const id = selectedEntity?._id;
            if (id) openModulePicker?.(id);
          }
        },
        {
          icon: 'email',
          label: 'Email client',
          labelTextColor: 'white',
          style: { backgroundColor: 'white' },
          onPress: () => {
            closeMenu();
          }
        }
      ];

    default:
      return [];
  }
};

export default useGetFabOptions;
export { type FabOptionsProps, FabOptionsVariant };
