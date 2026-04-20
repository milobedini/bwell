import { type ComponentProps } from 'react';
import { ModuleType } from '@/types/types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  [ModuleType.QUESTIONNAIRE]: 'clipboard-text-outline',
  [ModuleType.ACTIVITY_DIARY]: 'calendar-week',
  [ModuleType.READING]: 'book-open-outline',
  [ModuleType.FIVE_AREAS_MODEL]: 'brain',
  [ModuleType.GENERAL_GOALS]: 'bullseye-arrow',
  [ModuleType.WEEKLY_GOALS]: 'message-text-outline'
};

export const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

/**
 * Appends "(Check-in)" to the title for General Goals re-rating attempts.
 * Works with both PracticeItem (iteration on latestAttempt) and AttemptListItem (iteration directly).
 */
export const getModuleDisplayTitle = (title: string, moduleType: string, iteration: number | undefined): string =>
  moduleType === ModuleType.GENERAL_GOALS && (iteration ?? 0) > 1 ? `${title} (Check-in)` : title;
