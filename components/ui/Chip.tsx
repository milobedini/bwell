import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/Colors';
import { AccessPolicy, AssignmentStatus, CanStartReason } from '@/types/types';
import type { AssignmentRecurrence, AvailableModulesItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';

import { ThemedText } from '../ThemedText';

import hourglass from '@/assets/lotties/hourglass.json';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type StatusChipProps = {
  label: string;
  color: string;
  borderColor: string;
  icon?: MCIName;
  iconElement?: ReactNode;
  className?: string;
};

const StatusChip = ({ label, color, borderColor, icon, iconElement, className }: StatusChipProps) => (
  <View
    className={`flex-row items-center gap-1 rounded-2xl border px-3 py-1 ${className ?? 'self-start'}`}
    style={{ borderColor }}
  >
    {iconElement ?? (icon ? <MaterialCommunityIcons name={icon} size={14} color={color} /> : null)}
    <ThemedText type="small" style={{ color, fontSize: 12, lineHeight: 16 }}>
      {label}
    </ThemedText>
  </View>
);

const PendingChip = ({ animate }: { animate?: boolean }) => (
  <StatusChip
    label="Pending verification"
    color={Colors.primary.info}
    borderColor={Colors.sway.bright}
    iconElement={
      animate ? (
        <LottieView source={hourglass} autoPlay loop style={{ width: 20, height: 20 }} />
      ) : (
        <MaterialIcons name="hourglass-top" size={14} color={Colors.primary.info} />
      )
    }
  />
);

type AccessPolicyChipProps = {
  accessPolicy: AccessPolicy;
};

const AccessPolicyChip = ({ accessPolicy }: AccessPolicyChipProps) => {
  switch (accessPolicy) {
    case AccessPolicy.ASSIGNED:
      return (
        <StatusChip
          label="Assigned"
          color={Colors.chip.infoBlue}
          borderColor={Colors.chip.infoBlueBorder}
          icon="calendar-clock"
        />
      );
    case AccessPolicy.OPEN:
      return (
        <StatusChip
          label="Open"
          color={Colors.chip.teal}
          borderColor={Colors.chip.tealBorder}
          icon="lock-open-variant-outline"
        />
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
        <StatusChip
          label="Needs assignment"
          color={Colors.chip.amber}
          borderColor={Colors.chip.amberBorder}
          icon="calendar-clock"
        />
      );
    default:
      return (
        <StatusChip label="Sign in" color={Colors.chip.red} borderColor={Colors.chip.redBorder} icon="calendar-clock" />
      );
  }
};

const CanStartChip = ({ meta }: CanStartChipProps) => {
  const { canStart, canStartReason } = meta;
  if (canStart)
    return (
      <StatusChip
        label="Ready"
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        icon="check-circle-outline"
      />
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
        <StatusChip
          label="Assigned"
          color={Colors.chip.infoBlue}
          borderColor={Colors.chip.infoBlueBorder}
          icon="clipboard-text-clock"
        />
      );
    case AssignmentStatus.IN_PROGRESS:
      return (
        <View className="self-start rounded-2xl" style={{ backgroundColor: Colors.primary.warning }}>
          <StatusChip
            label="In progress"
            color={Colors.primary.black}
            borderColor={Colors.primary.warning}
            iconElement={<MaterialCommunityIcons name="progress-clock" size={14} color={Colors.primary.black} />}
          />
        </View>
      );
    default:
      return null;
  }
};

const DueChip = ({ dueAt, completed }: { dueAt?: string; completed?: boolean }) => {
  if (!dueAt)
    return (
      <StatusChip
        label="No deadline"
        color={Colors.chip.neutral}
        borderColor={Colors.chip.neutralBorder}
        icon="calendar"
      />
    );

  const due = new Date(dueAt);

  if (completed)
    return (
      <StatusChip
        label={`Completed ${due.toLocaleDateString()}`}
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        icon="check-circle-outline"
      />
    );

  return (
    <StatusChip
      label={`Due ${due.toLocaleDateString()}`}
      color={Colors.chip.neutral}
      borderColor={Colors.chip.neutralBorder}
      icon="calendar"
    />
  );
};

const TimeLeftChip = ({ dueAt }: { dueAt: string }) => {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - Date.now();

  let icon: MCIName = 'calendar-clock';
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
    label = `${days} ${days === 1 ? 'day' : 'days'} left`;
  }

  return <StatusChip label={label} color={color} borderColor={border} icon={icon} />;
};

const RecurrenceChip = ({ recurrence }: { recurrence: AssignmentRecurrence }) => {
  if (!recurrence?.freq || recurrence.freq === 'none') return null;

  const freq = recurrence.freq.toLowerCase();
  const interval = recurrence.interval ?? 1;

  let label = '';
  let icon: MCIName = 'repeat';
  const color = Colors.chip.infoBlue;
  const border = Colors.chip.infoBlueBorder;

  if (freq === 'weekly') {
    if (interval === 1) label = 'Weekly';
    else if (interval === 2) label = 'Biweekly';
    else label = `Every ${interval}w`;
    icon = 'calendar-week';
  } else if (freq === 'monthly') {
    if (interval === 1) label = 'Monthly';
    else label = `Every ${interval}m`;
    icon = 'calendar-month';
  } else {
    return null;
  }

  return <StatusChip label={label} color={color} borderColor={border} icon={icon} />;
};

const DateChip = ({ dateString, prefix }: { dateString: string; prefix?: string }) => {
  const date = new Date(dateString);

  return (
    <StatusChip
      label={`${prefix ? `${prefix} ` : ''}${date.toLocaleDateString()}`}
      color={Colors.chip.neutral}
      borderColor={Colors.chip.neutralBorder}
      icon="calendar"
    />
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
      <StatusChip
        label="Saving"
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        className="mt-2 self-center"
        iconElement={<ActivityIndicator animating color={Colors.sway.bright} size="small" />}
      />
    );

  if (saved)
    return (
      <StatusChip
        label="Saved"
        color={Colors.chip.green}
        borderColor={Colors.chip.greenBorder}
        className="mt-2 self-center"
        icon="check-circle-outline"
      />
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
  StatusChip,
  TimeLeftChip
};
