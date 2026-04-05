import { type ComponentProps } from 'react';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline',
  five_areas_model: 'brain'
};

export const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';
