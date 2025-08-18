import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { Calendar, TimePickerModal } from 'react-native-paper-dates';
import { deviceDatesLocaleKey } from '@/app/_layout';
import SelectField from '@/components/ui/SelectField';
import { endOfLocalDay, formatForField, toMongoISOString } from '@/utils/dates';
import usePickerConstants from '@/utils/usePickerConstants';

import { ThemedText } from '../ThemedText';

type DueDateFieldProps = {
  value?: string;
  onChange: (iso?: string) => void;
  label?: string;
};

const DueDateField = ({ value, onChange, label = 'Due date' }: DueDateFieldProps) => {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>();

  const { dialogHeight, verticalMargin } = usePickerConstants();

  const selected = useMemo(() => (value ? new Date(value) : undefined), [value]);
  const hasExplicitTime = useMemo(() => {
    if (!selected) return false;
    return !(selected.getHours() === 23 && selected.getMinutes() === 59);
  }, [selected]);

  const fieldText = useMemo(() => {
    if (!selected) return undefined;
    return formatForField(selected, hasExplicitTime);
  }, [selected, hasExplicitTime]);

  // range: today → +2y
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(today.getFullYear() + 2);
    return d;
  }, [today]);

  const openPicker = () => {
    const current = selected ?? today;
    const clamped = current < today ? today : current > maxDate ? maxDate : current;
    setTempDate(clamped);
    setDateOpen(true);
  };

  const clear = () => onChange(undefined);

  const confirmDateNoTime = (picked: Date) => {
    onChange(toMongoISOString(endOfLocalDay(picked)));
    setDateOpen(false);
  };

  const proceedAddTime = (picked: Date) => {
    const carry = selected ? new Date(selected) : new Date(picked);
    carry.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    const lookedLikeEOD = !selected || (selected.getHours() === 23 && selected.getMinutes() === 59);
    if (lookedLikeEOD) carry.setHours(9, 0, 0, 0);
    onChange(toMongoISOString(carry));
    setDateOpen(false);
    setTimeOpen(true);
  };

  const onConfirmTime = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setTimeOpen(false);
    const d = selected ? new Date(selected) : new Date();
    d.setHours(hours, minutes, 0, 0);
    onChange(toMongoISOString(d));
  };

  return (
    <>
      <SelectField
        label={label}
        value={fieldText}
        placeholder="Pick a date (optional)"
        selected={!!value}
        leftIcon="calendar-month-outline"
        onPress={openPicker}
        onClear={clear}
        fullWidth
      />

      <Portal>
        <Dialog
          visible={dateOpen}
          onDismiss={() => setDateOpen(false)}
          style={{ height: dialogHeight, alignSelf: 'center', width: '90%', marginVertical: verticalMargin }}
          dismissableBackButton
        >
          <Dialog.Title>
            <ThemedText type="subtitle" onLight className="text-center">
              {label}
            </ThemedText>
          </Dialog.Title>
          <Dialog.ScrollArea style={{ height: '100%' }}>
            <Calendar
              mode="single"
              locale={deviceDatesLocaleKey}
              date={tempDate}
              onChange={(params) => setTempDate(params?.date ?? tempDate)}
              startWeekOnMonday
              validRange={{
                startDate: today,
                endDate: maxDate
              }}
              startYear={today.getFullYear()}
              endYear={maxDate.getFullYear()}
            />
          </Dialog.ScrollArea>

          <Dialog.Actions style={{ justifyContent: 'space-between' }}>
            <Button onPress={() => setDateOpen(false)}>Cancel</Button>
            <View style={{ flexDirection: 'row' }}>
              <Button
                onPress={() => tempDate && confirmDateNoTime(tempDate)}
                disabled={!tempDate}
                style={{ marginRight: 8 }}
              >
                Confirm
              </Button>
              <Button mode="contained" onPress={() => tempDate && proceedAddTime(tempDate)} disabled={!tempDate}>
                Add time
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <TimePickerModal
        visible={timeOpen}
        onDismiss={() => setTimeOpen(false)}
        onConfirm={onConfirmTime}
        hours={selected ? selected.getHours() : 9}
        minutes={selected ? selected.getMinutes() : 0}
        label="Select time"
        cancelLabel="Cancel"
        confirmLabel="Set"
        uppercase={false}
        locale={deviceDatesLocaleKey}
      />
    </>
  );
};

export default DueDateField;
