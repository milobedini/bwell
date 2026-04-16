import { useMemo } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { getInitials } from '@/utils/initials';
import type { User } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type TherapistCardProps = {
  therapist: User | null;
};

const AVATAR_SIZE = 40;

const TherapistCard = ({ therapist }: TherapistCardProps) => {
  const initials = useMemo(() => {
    if (!therapist) return '';
    return getInitials(therapist.name ?? therapist.username);
  }, [therapist]);

  if (!therapist) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: 100 }}
      >
        <View
          className="mx-4 rounded-2xl p-4"
          style={{ backgroundColor: Colors.chip.darkCard }}
          accessibilityRole="text"
          accessibilityLabel="No therapist assigned"
        >
          <View className="flex-row items-center gap-3">
            <View
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                backgroundColor: Colors.tint.neutral,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MaterialCommunityIcons name="account-off-outline" size={20} color={Colors.sway.darkGrey} />
            </View>
            <View className="flex-1">
              <ThemedText type="smallBold" style={{ color: Colors.sway.darkGrey }}>
                No therapist assigned
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                Contact your provider to get started
              </ThemedText>
            </View>
          </View>
        </View>
      </MotiView>
    );
  }

  const displayName = therapist.name || therapist.username;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: 100 }}
    >
      <View
        className="mx-4 rounded-2xl p-4"
        style={{
          backgroundColor: Colors.chip.darkCard,
          borderWidth: 1,
          borderColor: Colors.tintSubtle.tealBorder
        }}
        accessibilityRole="text"
        accessibilityLabel={`Your therapist: ${displayName}`}
        testID="therapist-card"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: Colors.therapist.purple,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ThemedText type="smallBold" style={{ color: Colors.primary.white }}>
              {initials}
            </ThemedText>
          </View>

          <View className="flex-1">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              Your Therapist
            </ThemedText>
            <View className="flex-row items-center gap-1.5">
              <ThemedText type="smallBold">{displayName}</ThemedText>
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.sway.bright} />
            </View>
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default TherapistCard;
