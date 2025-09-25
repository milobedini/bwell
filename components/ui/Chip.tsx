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
          icon={() => <MaterialCommunityIcons name="progress-clock" size={24} color="black" />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: 'black'
          }}
          compact
          style={{
            backgroundColor: Colors.primary.warning,
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

const DueChip = ({ dueAt, completed }: { dueAt?: string; completed?: boolean }) => {
  if (!dueAt)
    return (
      <Chip
        mode="outlined"
        compact
        icon={() => <MaterialCommunityIcons name="calendar" size={24} color="#E6E8EF" />}
        textStyle={{ color: '#E6E8EF', fontFamily: Fonts.Black, fontSize: 16 }}
        style={{ borderColor: '#3B3F51', backgroundColor: 'transparent', alignSelf: 'flex-start' }}
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
        icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color="#34D399" />}
        textStyle={{ color: '#34D399', fontFamily: Fonts.Black, fontSize: 16 }}
        style={{ borderColor: '#065F46', backgroundColor: 'transparent', alignSelf: 'flex-start' }}
      >
        {`Completed ${due.toLocaleDateString()}`}
      </Chip>
    );

  return (
    <Chip
      mode="outlined"
      compact
      icon={() => <MaterialCommunityIcons name="calendar" size={24} color="#E6E8EF" />}
      textStyle={{ color: '#E6E8EF', fontFamily: Fonts.Black, fontSize: 16 }}
      style={{ borderColor: '#3B3F51', backgroundColor: 'transparent', alignSelf: 'flex-start' }}
    >
      {`Due ${due.toLocaleDateString()}`}
    </Chip>
  );
};

const TimeLeftChip = ({ dueAt }: { dueAt: string }) => {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - Date.now();

  // Defaults (used for the "days left" case)
  let icon: IconProps['name'] = 'calendar-clock';
  let color = '#93C5FD'; // info blue
  let border = '#1E3A8A'; // deep blue border
  let label = '';

  if (diffMs <= 0) {
    // Overdue
    icon = 'calendar-remove';
    color = '#F87171'; // red
    border = '#7F1D1D'; // dark red border
    label = 'Overdue';
  } else if (diffMs < 24 * 60 * 60 * 1000) {
    // Under 24h → show hours (rounded to nearest hour, min 1h)
    const hours = Math.max(1, Math.round(diffMs / 36e5));
    icon = 'clock-alert';
    color = '#FBBF24'; // amber
    border = '#7C5E12'; // amber/dark border
    label = `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  } else {
    // 24h+ → show days (rounded up so 1.2d shows as 2 days)
    const days = Math.ceil(diffMs / 86400000);
    icon = 'calendar-clock';
    color = '#93C5FD'; // info blue
    border = '#1E3A8A'; // deep blue border
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
  const color = '#93C5FD'; // info blue (consistent with your "Assigned"/"In progress")
  const border = '#1E3A8A'; // deep blue border (consistent)

  if (freq === 'weekly') {
    label =
      interval === 1 ? 'Repeats weekly' : interval === 2 ? 'Repeats every 2 weeks' : `Repeats every ${interval} weeks`;
    icon = 'calendar-week';
  } else if (freq === 'monthly') {
    label = interval === 1 ? 'Repeats monthly' : `Repeats every ${interval} months`;
    icon = 'calendar-month';
  } else {
    // Not a supported recurrence → render nothing
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
      icon={() => <MaterialCommunityIcons name="calendar" size={24} color="#E6E8EF" />}
      textStyle={{ color: '#E6E8EF', fontFamily: Fonts.Black, fontSize: 16, textTransform: 'capitalize' }}
      style={{ borderColor: '#3B3F51', backgroundColor: 'transparent', alignSelf: 'flex-start' }}
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
        textStyle={{ fontFamily: Fonts.Black, color: '#34D399' }}
        style={{ backgroundColor: Colors.sway.dark, alignSelf: 'center', marginTop: 8 }}
        icon={() => <ActivityIndicator animating color={Colors.sway.bright} style={{ marginRight: 12 }} />}
      >
        Saving
      </Chip>
    );
  if (saved)
    return (
      <Chip
        icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color={'#34D399'} />}
        mode="outlined"
        textStyle={{ fontFamily: Fonts.Black, color: '#34D399' }}
        style={{
          backgroundColor: Colors.sway.buttonBackground,
          borderColor: '#065F46',
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
