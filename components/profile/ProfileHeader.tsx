import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatMemberSince } from '@/utils/dates';
import { getInitials } from '@/utils/initials';
import { isTherapist as checkTherapist } from '@/utils/userRoles';
import type { ProfileResponse } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type ProfileHeaderProps = {
  profile: ProfileResponse;
};

const AVATAR_SIZE = 56;

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const therapist = useMemo(() => checkTherapist(profile.roles), [profile.roles]);

  const displayName = profile.name || profile.username;
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const avatarColour = therapist ? Colors.therapist.purple : Colors.sway.bright;
  const memberSince = formatMemberSince(profile.createdAt);

  return (
    <View className="items-center px-4 pb-2">
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

      <View className="mt-3 items-center gap-0.5">
        <ThemedText type="smallTitle" style={{ marginBottom: 0 }}>
          {displayName}
        </ThemedText>

        {profile.name && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            @{profile.username}
          </ThemedText>
        )}

        <View className="mt-1.5 flex-row items-center gap-2">
          <View
            className="items-center rounded-md px-2 py-0.5"
            style={{
              backgroundColor: therapist ? Colors.therapist.tint : Colors.tint.teal,
              borderWidth: 1,
              borderColor: therapist ? Colors.therapist.tintBorder : Colors.tint.tealBorder
            }}
          >
            <ThemedText
              type="small"
              style={{
                color: therapist ? Colors.therapist.purpleLight : Colors.sway.bright,
                fontSize: 12,
                lineHeight: 16
              }}
            >
              {therapist ? 'Therapist' : 'Patient'}
            </ThemedText>
          </View>

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

        {memberSince ? (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 6, fontSize: 12 }}>
            {memberSince}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

export default ProfileHeader;
