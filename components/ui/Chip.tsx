import type { ReactNode } from 'react';
import { Chip } from 'react-native-paper';
import type { IconProps } from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AccessPolicy, AssignmentStatus, CanStartReason } from '@/types/types';
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
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color="#93C5FD" />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#93C5FD'
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#1E3A8A',
            alignSelf: 'flex-start'
          }}
        >
          Assignment only
        </Chip>
      );

    case AccessPolicy.ENROLLED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="account-star" size={24} color="#C4B5FD" />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#C4B5FD'
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#1E3A8A',
            alignSelf: 'flex-start'
          }}
        >
          Enrolled only
        </Chip>
      );
    case AccessPolicy.OPEN:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="lock-open-variant-outline" size={24} color="#2DD4BF" />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#2DD4BF'
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#164E4E',
            alignSelf: 'flex-start'
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

const BlockedChip = (reason: CanStartReason): ReactNode => {
  switch (reason) {
    case CanStartReason.REQUIRES_ASSIGNMENT:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color="#FBBF24" />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#FBBF24'
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#7C5E12',
            alignSelf: 'flex-start'
          }}
        >
          Awaiting assignment
        </Chip>
      );
    case CanStartReason.NOT_ENROLLED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="account-plus-outline" size={24} color="#FBBF24" />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#FBBF24'
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#7C5E12',
            alignSelf: 'flex-start'
          }}
        >
          Awaiting enrollment
        </Chip>
      );
    default:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color="#F87171" />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#F87171'
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#7F1D1D',
            alignSelf: 'flex-start'
          }}
        >
          Sign in to start
        </Chip>
      );
  }
};

const CanStartChip = ({ meta }: CanStartChipProps) => {
  const { canStart, canStartReason } = meta;
  if (canStart)
    return (
      <Chip
        icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color={'#34D399'} />}
        mode="outlined"
        textStyle={{
          fontFamily: Fonts.Black,
          color: '#34D399'
        }}
        compact
        style={{
          backgroundColor: Colors.sway.buttonBackground,
          borderColor: '#065F46',
          alignSelf: 'flex-start'
        }}
      >
        Ready to start
      </Chip>
    );

  return BlockedChip(canStartReason as CanStartReason);
};
type AssignmentStatusChipProps = {
  status: AssignmentStatus;
};

const AssignmentStatusChip = ({ status }: AssignmentStatusChipProps) => {
  switch (status) {
    case AssignmentStatus.ASSIGNED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="clipboard-text-clock" size={24} color={'#93C5FD'} />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#93C5FD'
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#1E3A8A',
            alignSelf: 'flex-start'
          }}
        >
          Assigned
        </Chip>
      );
    case AssignmentStatus.IN_PROGRESS:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="progress-clock" size={24} color="#93C5FD" />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#93C5FD'
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#1E3A8A',
            alignSelf: 'flex-start'
          }}
        >
          In progress
        </Chip>
      );
    default:
      return;
  }
};

const DueChip = ({ dueAt }: { dueAt?: string }) => {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const msLeft = +due - Date.now();
  const hoursLeft = msLeft / 36e5;

  let icon: string = 'calendar';
  let color = '#E6E8EF';
  let border = '#3B3F51';
  let label = `Due ${due.toLocaleDateString()}`;

  if (hoursLeft <= 0) {
    icon = 'calendar-remove';
    color = '#F87171';
    border = '#7F1D1D';
    label = 'Overdue';
  } else if (hoursLeft <= 48) {
    icon = 'calendar-alert';
    color = '#FBBF24';
    border = '#7C5E12';
    label = 'Due soon';
  }

  return (
    <Chip
      mode="outlined"
      compact
      icon={() => <MaterialCommunityIcons name={icon as IconProps['name']} size={18} color={color} />}
      textStyle={{ color, fontFamily: Fonts.Black, fontSize: 12 }}
      style={{ borderColor: border, backgroundColor: 'transparent' }}
    >
      {label}
    </Chip>
  );
};

export { AccessPolicyChip, AssignmentStatusChip, CanStartChip, DueChip, EnrolledChip, PendingChip };
