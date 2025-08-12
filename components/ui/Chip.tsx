import { Chip } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AccessPolicy } from '@/types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export { AccessPolicyChip, EnrolledChip };
