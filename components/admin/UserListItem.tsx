import { Pressable, View } from 'react-native';
import type { SortOption } from '@/components/admin/SortButton';
import { Colors } from '@/constants/Colors';
import type { UsersListItem } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import { StatusChip } from '../ui/Chip';

type UserListItemProps = {
  user: UsersListItem;
  sort?: SortOption;
  onPress?: () => void;
};

const ROLE_COLORS: Record<string, { color: string; border: string }> = {
  patient: { color: Colors.chip.green, border: Colors.chip.greenBorder },
  therapist: { color: Colors.chip.infoBlue, border: Colors.chip.infoBlueBorder },
  admin: { color: Colors.chip.red, border: Colors.chip.redBorder }
};

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const getTimestamp = (user: UsersListItem, sort?: SortOption): { label: string; value: string } => {
  if (sort === 'lastLogin:desc') {
    return { label: '', value: formatRelativeTime(user.lastLogin) };
  }
  if (sort === 'createdAt:desc' || sort === 'createdAt:asc') {
    return { label: 'Created ', value: formatRelativeTime(user.createdAt) };
  }
  // Default: show last login
  return { label: '', value: formatRelativeTime(user.lastLogin) };
};

const UserListItem = ({ user, sort, onPress }: UserListItemProps) => {
  const primaryName = user.name ?? user.username;
  const showUsername = !!user.name;
  const timestamp = getTimestamp(user, sort);

  return (
    <Pressable
      onPress={onPress}
      className="gap-1.5 px-4 py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {/* Row 1: Name + timestamp */}
      <View className="flex-row items-baseline justify-between">
        <ThemedText type="smallTitle" className="shrink" numberOfLines={1}>
          {primaryName}
        </ThemedText>
        <ThemedText type="small" className="ml-3 text-sway-darkGrey" numberOfLines={1}>
          {timestamp.label}
          {timestamp.value}
        </ThemedText>
      </View>

      {/* Row 2: Username */}
      {showUsername && (
        <ThemedText type="small" className="text-sway-darkGrey" numberOfLines={1}>
          @{user.username}
        </ThemedText>
      )}

      {/* Row 3: Email */}
      <ThemedText type="small" className="text-sway-darkGrey" numberOfLines={1}>
        {user.email}
      </ThemedText>

      {/* Row 3: Role badges + verification */}
      <View className="flex-row flex-wrap items-center gap-2">
        {user.roles.map((role) => {
          const colors = ROLE_COLORS[role] ?? {
            color: Colors.chip.neutral,
            border: Colors.chip.neutralBorder
          };
          return (
            <StatusChip
              key={role}
              label={role.charAt(0).toUpperCase() + role.slice(1)}
              color={colors.color}
              borderColor={colors.border}
            />
          );
        })}

        {user.isVerified === false && (
          <StatusChip
            label="Email unverified"
            color={Colors.chip.amber}
            borderColor={Colors.chip.amberBorder}
            icon="email-alert-outline"
          />
        )}

        {user.roles.includes('therapist') && (
          <StatusChip
            label={user.isVerifiedTherapist ? 'Verified therapist' : 'Unverified therapist'}
            color={user.isVerifiedTherapist ? Colors.chip.green : Colors.chip.amber}
            borderColor={user.isVerifiedTherapist ? Colors.chip.greenBorder : Colors.chip.amberBorder}
            icon={user.isVerifiedTherapist ? 'check-decagram' : 'clock-outline'}
          />
        )}
      </View>

      {/* Row 4: Therapist info (for patients) */}
      {user.therapistInfo && (
        <ThemedText type="small" className="text-sway-darkGrey">
          Therapist: {user.therapistInfo.name ?? user.therapistInfo.username}
        </ThemedText>
      )}
    </Pressable>
  );
};

export default UserListItem;
