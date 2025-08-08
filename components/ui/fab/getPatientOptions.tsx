import type { User } from '@milobedini/shared-types';

import { FabGroupAction } from './FabGroup';

const getPatientOptions = (closeMenu: () => void, selectedPatient?: User): FabGroupAction[] => [
  {
    icon: 'star',
    label: 'Add as client',
    labelTextColor: 'white',
    // color: 'gold',
    style: { backgroundColor: 'white' },
    onPress: () => {
      console.log('Starred', selectedPatient?.username);
      closeMenu();
    }
  },
  {
    icon: 'email',
    label: 'Email patient',
    labelTextColor: 'white',
    style: { backgroundColor: 'white' },
    onPress: () => {
      console.log('Email to', selectedPatient?.email);
      closeMenu();
    }
  }
];

export default getPatientOptions;
