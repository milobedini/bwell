import { Chip } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AccessPolicy } from '@/types/types';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import type { AvailableModulesItem } from '@milobedini/shared-types';

import hourglass from '@/assets/lotties/hourglass.json';

const EnrolledChip = () => {
  return (
    <Chip
      icon={() => <MaterialCommunityIcons name="bookmark-check" size={24} color={Colors.primary.charcoal} />}
      mode="outlined"
      compact
      textStyle={{
        fontFamily: Fonts.Black,
        color: Colors.primary.charcoal
      }}
      style={{
        backgroundColor: Colors.primary.accent,
        borderColor: Colors.primary.rose
      }}
    >
      Enrolled
    </Chip>
  );
};

const PendingChip = ({ animate }: { animate?: boolean }) => {
  const animatedIcon = <LottieView source={hourglass} autoPlay loop style={{ width: 42, height: 42 }} />;

  return (
    <Chip
      icon={() => {
        if (animate) return animatedIcon;
        return <MaterialIcons name="hourglass-top" size={24} color={Colors.primary.info} />;
      }}
      textStyle={{
        fontFamily: Fonts.Black,
        color: Colors.primary.info
      }}
      style={{
        backgroundColor: Colors.sway.buttonBackground,
        borderColor: Colors.sway.bright
      }}
    >
      Awaiting BWell verification
    </Chip>
  );
};

type AccessPolicyChipProps = {
  accessPolicy: AccessPolicy;
};

const AccessPolicyChip = ({ accessPolicy }: AccessPolicyChipProps) => {
  switch (accessPolicy) {
    case AccessPolicy.ASSIGNED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.sway.lightGrey} />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.sway.lightGrey
          }}
          style={{
            backgroundColor: Colors.primary.charcoal,
            borderColor: Colors.sway.darkGrey
          }}
        >
          Assignment only
        </Chip>
      );

    case AccessPolicy.ENROLLED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="account-star" size={24} color={Colors.sway.lightGrey} />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.sway.lightGrey
          }}
          style={{
            backgroundColor: Colors.primary.charcoal,
            borderColor: Colors.sway.darkGrey
          }}
        >
          Enrolled only
        </Chip>
      );
    case AccessPolicy.OPEN:
      return (
        <Chip
          icon={() => (
            <MaterialCommunityIcons name="lock-open-variant-outline" size={24} color={Colors.sway.lightGrey} />
          )}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.sway.lightGrey
          }}
          style={{
            backgroundColor: Colors.primary.charcoal,
            borderColor: Colors.sway.darkGrey
          }}
        >
          Open
        </Chip>
      );

    default:
      return null;
  }
};

type CanStartChipProps = {
  meta: AvailableModulesItem['meta'];
};
const CanStartChip = ({ meta }: CanStartChipProps) => {
  const { canStart, canStartReason, source } = meta;
  if (canStart)
    return (
      <Chip>
        Can start chip {canStart} {canStartReason} {source.map((x) => x)}
      </Chip>
    );

  return (
    <Chip>
      Cannot start chip {canStart} {canStartReason} {source.map((x) => x)}
    </Chip>
  );
};

export { AccessPolicyChip, CanStartChip, EnrolledChip, PendingChip };
