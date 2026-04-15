import { type ComponentProps } from 'react';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline',
  five_areas_model: 'brain',
  general_goals: 'bullseye-arrow'
};

export const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

/**
 * Appends "(Check-in)" to the title for General Goals re-rating attempts.
 * Works with both PracticeItem (iteration on latestAttempt) and AttemptListItem (iteration directly).
 */
export const getModuleDisplayTitle = (title: string, moduleType: string, iteration: number | undefined): string =>
  moduleType === 'general_goals' && (iteration ?? 0) > 1 ? `${title} (Check-in)` : title;
