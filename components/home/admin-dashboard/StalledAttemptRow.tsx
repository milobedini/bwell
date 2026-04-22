import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatCompactTimeAgo } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { AdminStalledAttemptRow as AdminStalledAttemptRowType } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

type Props = {
  row: AdminStalledAttemptRowType;
  isLast?: boolean;
};

const StalledAttemptRow = memo(({ row, isLast }: Props) => {
  const therapistLabel = row.therapist
    ? row.therapist.isVerifiedTherapist
      ? `Therapist ${row.therapist.username}`
      : `Therapist ${row.therapist.username} · unverified`
    : 'Self-help';

  return (
    <View
      className="px-4 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: Colors.divider.light
      }}
      accessibilityRole="summary"
      accessibilityLabel={`Stalled ${row.moduleType} for ${row.user.username}`}
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
            <ThemedText type="caption" style={{ color: Colors.primary.warning }}>
              {formatCompactTimeAgo(row.lastInteractionAt)}
            </ThemedText>
          </View>
          <ThemedText type="caption" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
            {row.module.title}
          </ThemedText>
          <ThemedText type="caption" style={{ color: Colors.sway.darkGrey, fontSize: 12, marginTop: 1 }}>
            {therapistLabel}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

StalledAttemptRow.displayName = 'StalledAttemptRow';

export default StalledAttemptRow;
