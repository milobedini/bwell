import { useCallback } from 'react';
import { useAddRemoveClient } from '@/hooks/useUsers';
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
};

const useGetFabOptions = ({ variant, closeMenu, selectedEntity, isClient }: FabOptionsProps): FabGroupAction[] => {
  const addRemoveClient = useAddRemoveClient();

  const handleAddRemoveClient = useCallback(() => {
    if (selectedEntity?._id) {
      addRemoveClient.mutate(
        { clientId: selectedEntity._id },
        {
          onSuccess: (data) => {
            console.log(data.message);
            // Use toast for message
            closeMenu();
          },
          onError: (error) => {
            console.log(error.message);
            // Use toast for message
            closeMenu();
          }
        }
      );
    }
  }, [addRemoveClient, closeMenu, selectedEntity?._id]);

  switch (variant) {
    case FabOptionsVariant.PATIENTS:
      return [
        {
          icon: 'star',
          label: isClient ? 'Remove as client' : 'Add as client',
          labelTextColor: 'white',
          // color: 'gold',
          style: { backgroundColor: 'white' },
          onPress: handleAddRemoveClient
        },
        {
          icon: 'email',
          label: 'Email patient',
          labelTextColor: 'white',
          style: { backgroundColor: 'white' },
          onPress: () => {
            console.log('Email to', selectedEntity?.email);
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
          onPress: handleAddRemoveClient
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
