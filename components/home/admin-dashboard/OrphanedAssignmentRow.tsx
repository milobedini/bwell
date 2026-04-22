import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatCompactTimeAgo } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { AdminOrphanedAssignmentRow as AdminOrphanedAssignmentRowType } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

type Props = {
  row: AdminOrphanedAssignmentRowType;
  isLast?: boolean;
};

const reasonCopy = (row: AdminOrphanedAssignmentRowType): { label: string; accent: string } => {
  if (row.reason === 'therapist_missing') {
    return { label: 'Therapist account deleted', accent: Colors.primary.error };
  }
  return {
    label: row.therapist ? `Therapist @${row.therapist.username} is unverified` : 'Assigned therapist is unverified',
    accent: Colors.primary.warning
  };
};

const OrphanedAssignmentRow = memo(({ row, isLast }: Props) => {
  const { label: reasonLabel, accent } = reasonCopy(row);
  const dueText = row.dueAt ? `Due ${formatCompactTimeAgo(row.dueAt)}` : null;

  return (
    <View
      className="px-4 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: Colors.divider.light
      }}
      accessibilityRole="summary"
      accessibilityLabel={`Orphaned assignment for ${row.user.username}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="size-9 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.tint.neutral }}
        >
          <Icon name={getModuleIcon(row.moduleType)} size={18} color={Colors.sway.darkGrey} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
              {row.user.username}
            </ThemedText>
            <ThemedText type="caption" style={{ color: Colors.sway.darkGrey }}>
              assigned {formatCompactTimeAgo(row.assignedAt)}
            </ThemedText>
          </View>
          <ThemedText type="caption" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
            {row.module.title}
          </ThemedText>
          <View className="mt-1 flex-row items-center gap-2">
            <Icon name="link-variant-off" size={12} color={accent} />
            <ThemedText type="caption" style={{ color: accent, fontSize: 12, flex: 1 }}>
              {reasonLabel}
            </ThemedText>
            {dueText && (
              <ThemedText type="caption" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
                {dueText}
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

OrphanedAssignmentRow.displayName = 'OrphanedAssignmentRow';

export default OrphanedAssignmentRow;
