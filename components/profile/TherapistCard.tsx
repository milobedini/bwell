import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { User } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type TherapistCardProps = {
  therapist: User | null;
  onPress?: () => void;
};

const AVATAR_SIZE = 40;

const TherapistCard = ({ therapist, onPress }: TherapistCardProps) => {
  const initials = useMemo(() => {
    if (!therapist) return '';
    const displayName = therapist.name ?? therapist.username;
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
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

  const displayName = therapist.name ?? therapist.username;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: 100 }}
    >
      <Pressable
        className="mx-4 rounded-2xl p-4 active:opacity-80"
        style={{
          backgroundColor: Colors.chip.darkCard,
          borderWidth: 1,
          borderColor: Colors.tintSubtle.tealBorder
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Your therapist: ${displayName}`}
        testID="therapist-card"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: '#7C3AED',
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

          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.sway.darkGrey} />
        </View>
      </Pressable>
    </MotiView>
  );
};

export default TherapistCard;
