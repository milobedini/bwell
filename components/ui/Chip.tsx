import type { ReactNode } from 'react';
import { ActivityIndicator, Chip } from 'react-native-paper';
import type { IconProps } from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AccessPolicy, AssignmentStatus, CanStartReason } from '@/types/types';
import type { AssignmentRecurrence, AvailableModulesItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';

import hourglass from '@/assets/lotties/hourglass.json';

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
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.chip.infoBlue} />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.chip.infoBlue
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: Colors.chip.infoBlueBorder,
            alignSelf: 'flex-start'
          }}
        >
          Assignment only
        </Chip>
      );

    case AccessPolicy.OPEN:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="lock-open-variant-outline" size={24} color={Colors.chip.teal} />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.chip.teal
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: Colors.chip.tealBorder,
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
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.chip.amber} />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.chip.amber
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: Colors.chip.amberBorder,
            alignSelf: 'flex-start'
          }}
        >
          Awaiting assignment
        </Chip>
      );

    default:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.chip.red} />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.chip.red
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: Colors.chip.redBorder,
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
        icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color={Colors.chip.green} />}
        mode="outlined"
        textStyle={{
          fontFamily: Fonts.Black,
          color: Colors.chip.green
        }}
        compact
        style={{
          backgroundColor: Colors.sway.buttonBackground,
          borderColor: Colors.chip.greenBorder,
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
          icon={() => <MaterialCommunityIcons name="clipboard-text-clock" size={24} color={Colors.chip.infoBlue} />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.chip.infoBlue
          }}
          compact
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: Colors.chip.infoBlueBorder,
            alignSelf: 'flex-start'
          }}
        >
          Assigned
        </Chip>
      );
    case AssignmentStatus.IN_PROGRESS:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="progress-clock" size={24} color={Colors.primary.black} />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.primary.black
          }}
          compact
          style={{
            backgroundColor: Colors.primary.warning,
            borderColor: Colors.chip.infoBlueBorder,
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

const DueChip = ({ dueAt, completed }: { dueAt?: string; completed?: boolean }) => {
  if (!dueAt)
    return (
      <Chip
        mode="outlined"
        compact
        icon={() => <MaterialCommunityIcons name="calendar" size={24} color={Colors.chip.neutral} />}
        textStyle={{ color: Colors.chip.neutral, fontFamily: Fonts.Black, fontSize: 16 }}
        style={{ borderColor: Colors.chip.neutralBorder, backgroundColor: 'transparent', alignSelf: 'flex-start' }}
      >
        {`Open-ended`}
      </Chip>
    );
  const due = new Date(dueAt);

  if (completed)
    return (
      <Chip
        mode="outlined"
        compact
        icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color={Colors.chip.green} />}
        textStyle={{ color: Colors.chip.green, fontFamily: Fonts.Black, fontSize: 16 }}
        style={{ borderColor: Colors.chip.greenBorder, backgroundColor: 'transparent', alignSelf: 'flex-start' }}
      >
        {`Completed ${due.toLocaleDateString()}`}
      </Chip>
    );

  return (
    <Chip
      mode="outlined"
      compact
      icon={() => <MaterialCommunityIcons name="calendar" size={24} color={Colors.chip.neutral} />}
      textStyle={{ color: Colors.chip.neutral, fontFamily: Fonts.Black, fontSize: 16 }}
      style={{ borderColor: Colors.chip.neutralBorder, backgroundColor: 'transparent', alignSelf: 'flex-start' }}
    >
      {`Due ${due.toLocaleDateString()}`}
    </Chip>
  );
};

const TimeLeftChip = ({ dueAt }: { dueAt: string }) => {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - Date.now();

  let icon: IconProps['name'] = 'calendar-clock';
  let color = Colors.chip.infoBlue;
  let border = Colors.chip.infoBlueBorder;
  let label = '';

  if (diffMs <= 0) {
    icon = 'calendar-remove';
    color = Colors.chip.red;
    border = Colors.chip.redBorder;
    label = 'Overdue';
  } else if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.round(diffMs / 36e5));
    icon = 'clock-alert';
    color = Colors.chip.amber;
    border = Colors.chip.amberBorder;
    label = `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  } else {
    const days = Math.ceil(diffMs / 86400000);
    icon = 'calendar-clock';
    color = Colors.chip.infoBlue;
    border = Colors.chip.infoBlueBorder;
    label = `${days} ${days === 1 ? 'day' : 'days'} left`;
  }

  return (
    <Chip
      mode="outlined"
      compact
      icon={() => <MaterialCommunityIcons name={icon} size={24} color={color} />}
      textStyle={{ color, fontFamily: Fonts.Black, fontSize: 16 }}
      style={{ borderColor: border, backgroundColor: 'transparent', alignSelf: 'flex-start' }}
    >
      {label}
    </Chip>
  );
};

const RecurrenceChip = ({ recurrence }: { recurrence: AssignmentRecurrence }) => {
  if (!recurrence || !recurrence?.freq || recurrence.freq === 'none') return null;

  const freq = recurrence.freq.toLowerCase();
  const interval = recurrence.interval ?? 1;

  let label = '';
  let icon: IconProps['name'] = 'repeat';
  const color = Colors.chip.infoBlue;
  const border = Colors.chip.infoBlueBorder;

  if (freq === 'weekly') {
    label =
      interval === 1 ? 'Repeats weekly' : interval === 2 ? 'Repeats every 2 weeks' : `Repeats every ${interval} weeks`;
    icon = 'calendar-week';
  } else if (freq === 'monthly') {
    label = interval === 1 ? 'Repeats monthly' : `Repeats every ${interval} months`;
    icon = 'calendar-month';
  } else {
    return null;
  }

  return (
    <Chip
      mode="outlined"
      compact
      icon={() => <MaterialCommunityIcons name={icon} size={24} color={color} />}
      textStyle={{ color, fontFamily: Fonts.Black, fontSize: 16 }}
      style={{ borderColor: border, backgroundColor: 'transparent', alignSelf: 'flex-start' }}
    >
      {label}
    </Chip>
  );
};

const DateChip = ({ dateString, prefix }: { dateString: string; prefix?: string }) => {
  const date = new Date(dateString);

  return (
    <Chip
      mode="outlined"
      icon={() => <MaterialCommunityIcons name="calendar" size={24} color={Colors.chip.neutral} />}
      textStyle={{ color: Colors.chip.neutral, fontFamily: Fonts.Black, fontSize: 16, textTransform: 'capitalize' }}
      style={{ borderColor: Colors.chip.neutralBorder, backgroundColor: 'transparent', alignSelf: 'flex-start' }}
    >
      {`${prefix ? `${prefix} ` : ''}${date.toLocaleDateString()}`}
    </Chip>
  );
};

type SaveProgressChipProps = {
  isSaving: boolean;
  saved: boolean;
};

const SaveProgressChip = ({ isSaving, saved }: SaveProgressChipProps) => {
  if (!isSaving && !saved) return null;
  if (isSaving)
    return (
      <Chip
        textStyle={{ fontFamily: Fonts.Black, color: Colors.chip.green }}
        style={{ backgroundColor: Colors.sway.dark, alignSelf: 'center', marginTop: 8 }}
        icon={() => <ActivityIndicator animating color={Colors.sway.bright} style={{ marginRight: 12 }} />}
      >
        Saving
      </Chip>
    );
  if (saved)
    return (
      <Chip
        icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color={Colors.chip.green} />}
        mode="outlined"
        textStyle={{ fontFamily: Fonts.Black, color: Colors.chip.green }}
        style={{
          backgroundColor: Colors.sway.buttonBackground,
          borderColor: Colors.chip.greenBorder,
          alignSelf: 'center',
          marginTop: 8
        }}
      >
        Saved
      </Chip>
    );
  return null;
};

export {
  AccessPolicyChip,
  AssignmentStatusChip,
  CanStartChip,
  DateChip,
  DueChip,
  PendingChip,
  RecurrenceChip,
  SaveProgressChip,
  TimeLeftChip
};
