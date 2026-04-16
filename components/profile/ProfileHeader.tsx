import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { isTherapist as checkTherapist } from '@/utils/userRoles';
import type { ProfileResponse } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type ProfileHeaderProps = {
  profile: ProfileResponse;
};

const AVATAR_SIZE = 56;

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const therapist = useMemo(() => checkTherapist(profile.roles), [profile.roles]);

  const initials = useMemo(() => {
    const displayName = profile.name || profile.username;
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [profile.name, profile.username]);

  const avatarColour = therapist ? '#7C3AED' : Colors.sway.bright;

  const displayName = profile.name || profile.username;

  return (
    <View className="flex-row items-center gap-4 px-4 pb-2">
      {/* Avatar */}
      <View
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          backgroundColor: avatarColour,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <ThemedText type="smallTitle" style={{ color: Colors.primary.white, marginBottom: 0, lineHeight: 24 }}>
          {initials}
        </ThemedText>
      </View>

      {/* Name / username / badges */}
      <View className="flex-1 gap-0.5">
        <ThemedText type="smallTitle" style={{ marginBottom: 0 }}>
          {displayName}
        </ThemedText>

        {profile.name && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            @{profile.username}
          </ThemedText>
        )}

        <View className="mt-1 flex-row items-center gap-2">
          {/* Role badge */}
          <View
            style={{
              backgroundColor: therapist ? 'rgba(124,58,237,0.15)' : Colors.tint.teal,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderWidth: 1,
              borderColor: therapist ? 'rgba(124,58,237,0.3)' : Colors.tint.tealBorder
            }}
          >
            <ThemedText
              type="small"
              style={{
                color: therapist ? '#A855F7' : Colors.sway.bright,
                fontSize: 12,
                lineHeight: 16
              }}
            >
              {therapist ? 'Therapist' : 'Patient'}
            </ThemedText>
          </View>

          {/* Verified badge for therapists */}
          {therapist && profile.isVerifiedTherapist && (
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.sway.bright} />
              <ThemedText type="small" style={{ color: Colors.sway.bright, fontSize: 12, lineHeight: 16 }}>
                Verified
              </ThemedText>
            </View>
          )}

          {therapist && !profile.isVerifiedTherapist && (
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.primary.warning} />
              <ThemedText type="small" style={{ color: Colors.primary.warning, fontSize: 12, lineHeight: 16 }}>
                Pending
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;
