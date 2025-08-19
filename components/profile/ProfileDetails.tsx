import { useMemo } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { displayUserRoles } from '@/utils/userRoles';
import type { ProfileResponse } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

type ProfileDetailsProps = {
  profile: ProfileResponse;
  isTherapist: boolean;
  isPatient: boolean;
};

const ProfileDetails = ({ profile, isTherapist, isPatient }: ProfileDetailsProps) => {
  const hasFullName = useMemo(() => !!profile?.name, [profile?.name]);

  return (
    <View className="flex-1 items-center pb-2">
      <ThemedText
        type="title"
        className="text-center"
        style={{
          color: Colors.sway.bright,
          marginBottom: 20
        }}
      >
        {hasFullName ? profile.name : profile.username}
      </ThemedText>

      {/* Info - stats later? */}
      <View>
        {hasFullName && <ThemedText>Username: {profile.username}</ThemedText>}
        <ThemedText>Assigned roles: {displayUserRoles(profile.roles)}</ThemedText>
        {isTherapist && (
          <ThemedText>
            {profile.isVerifiedTherapist
              ? 'You are an approved BWell therapist'
              : 'Your therapist verification is pending'}
          </ThemedText>
        )}
        {isPatient && profile.therapist && <ThemedText>Your therapist is: {profile.therapist.username}</ThemedText>}
        <ThemedText>Your registered email is: {profile.email}</ThemedText>
      </View>
    </View>
  );
};

export default ProfileDetails;
