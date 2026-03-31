import { type ComponentProps, memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dateString } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline'
};

const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

const getUrgencyColor = (dueAt?: string): string => {
  if (!dueAt) return Colors.sway.darkGrey;
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 0) return Colors.primary.error;
  if (diff <= 48 * 60 * 60 * 1000) return Colors.primary.warning;
  return Colors.sway.bright;
};

const getAttemptStatusLabel = (
  latestAttempt?: MyAssignmentView['latestAttempt']
): { label: string; bg: string; color: string } => {
  if (!latestAttempt) return { label: 'Not started', bg: Colors.tint.neutral, color: Colors.sway.darkGrey };
  if (latestAttempt.completedAt) return { label: 'Submitted', bg: Colors.chip.green, color: Colors.chip.greenBorder };
  return { label: 'In progress', bg: Colors.tint.teal, color: Colors.sway.bright };
};

type AssignmentCardProps = {
  item: MyAssignmentView;
  onOpenMenu: (id: string) => void;
};

const AssignmentCardBase = ({ item, onOpenMenu }: AssignmentCardProps) => {
  const urgencyColor = getUrgencyColor(item.dueAt);
  const icon = getModuleIcon(item.module.type);
  const attemptStatus = getAttemptStatusLabel(item.latestAttempt);
  const handleMenu = useCallback(() => onOpenMenu(item._id), [onOpenMenu, item._id]);

  const cardContent = (
    <View className="flex-row">
      {/* Urgency accent border */}
      <View className="w-1 rounded-l-lg" style={{ backgroundColor: urgencyColor }} />

      <View className="flex-1 gap-2 p-3">
        {/* Row 1: Icon + Title + Iteration + Dots */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            <MaterialCommunityIcons name={icon} size={18} color={Colors.sway.darkGrey} />
            <ThemedText type="smallTitle" numberOfLines={1} className="flex-shrink">
              {item.module.title}
            </ThemedText>
            {!!item.attemptCount && item.attemptCount > 1 && (
              <View className="rounded-full border px-2 py-0.5" style={{ borderColor: Colors.chip.neutralBorder }}>
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
                  #{item.attemptCount}
                </ThemedText>
              </View>
            )}
          </View>
          <Pressable
            onPress={handleMenu}
            className="h-8 w-8 items-center justify-center rounded-lg bg-chip-darkCardAlt active:opacity-70"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={16} color={Colors.sway.darkGrey} />
          </Pressable>
        </View>

        {/* Row 2: Chips */}
        <View className="flex-row flex-wrap gap-1.5">
          <DueChip dueAt={item.dueAt} />
          {item.dueAt && <TimeLeftChip dueAt={item.dueAt} />}
          {item.recurrence && <RecurrenceChip recurrence={item.recurrence} />}
          <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: attemptStatus.bg }}>
            <ThemedText type="small" style={{ color: attemptStatus.color, fontSize: 11 }}>
              {attemptStatus.label}
            </ThemedText>
          </View>
        </View>

        {/* Row 3: Notes preview */}
        {item.notes && (
          <ThemedText type="italic" numberOfLines={1} style={{ color: Colors.sway.darkGrey, fontSize: 13 }}>
            &quot;{item.notes}&quot;
          </ThemedText>
        )}
      </View>
    </View>
  );

  // If there's a latest attempt, wrap in a Link to navigate to it
  if (item.latestAttempt?._id) {
    return (
      <Link
        asChild
        href={{
          pathname: '/assignments/[id]',
          params: {
            id: item.latestAttempt._id,
            headerTitle: item.latestAttempt.completedAt
              ? `${item.module.title} (${dateString(item.latestAttempt.completedAt)})`
              : `${item.module.title} (In progress)`
          }
        }}
        push
        withAnchor
      >
        <Pressable className="overflow-hidden rounded-lg border border-chip-darkCardAlt bg-chip-pill active:opacity-80">
          {cardContent}
        </Pressable>
      </Link>
    );
  }

  return <View className="overflow-hidden rounded-lg border border-chip-darkCardAlt bg-chip-pill">{cardContent}</View>;
};

const AssignmentCard = memo(AssignmentCardBase);
export default AssignmentCard;
export { getUrgencyColor };
export type { AssignmentCardProps };
