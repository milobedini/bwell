import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Chip, Dialog, Portal, SegmentedButtons, TextInput } from 'react-native-paper';
import Constants from 'expo-constants';
import SelectField from '@/components/ui/SelectField';
import { Colors } from '@/constants/Colors';

import { ThemedText } from '../ThemedText';

export type AssignmentRecurrence = {
  freq: 'weekly' | 'monthly' | 'none';
  interval?: number;
};

type RecurrenceFieldProps = {
  value?: AssignmentRecurrence;
  onChange: (rec?: AssignmentRecurrence) => void;
  label?: string;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const formatRecurrence = (r?: AssignmentRecurrence) => {
  if (!r || r.freq === 'none') return 'No recurrence';
  const n = r.interval ?? 1;
  if (r.freq === 'weekly') return n === 1 ? 'Every week' : `Every ${n} weeks`;
  if (r.freq === 'monthly') return n === 1 ? 'Every month' : `Every ${n} months`;
  return 'No recurrence';
};

const RecurrenceField = ({ value, onChange, label = 'Recurrence' }: RecurrenceFieldProps) => {
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState<'none' | 'weekly' | 'monthly'>(value?.freq ?? 'none');
  const [interval, setInterval] = useState<number>(value?.interval ?? 1);
  const [intervalStr, setIntervalStr] = useState<string>(String(value?.interval ?? 1));

  const bounds = useMemo(() => (freq === 'weekly' ? { min: 1, max: 52 } : { min: 1, max: 12 }), [freq]);
  const suggested = useMemo(() => (freq === 'weekly' ? [1, 2, 3, 4, 6, 8] : [1, 2, 3, 6, 12]), [freq]);
  const showIntervalControls = freq !== 'none';

  const isManualValid = useMemo(() => {
    const n = parseInt(intervalStr, 10);
    return Number.isFinite(n) && n >= bounds.min && n <= bounds.max;
  }, [intervalStr, bounds]);

  const openDialog = () => {
    const f = value?.freq ?? 'none';
    const i = value?.interval ?? 1;
    setFreq(f);
    setInterval(i);
    setIntervalStr(String(i));
    setOpen(true);
  };

  const clear = () => onChange(undefined);

  const save = () => {
    if (freq === 'none') {
      onChange({ freq: 'none' });
      setOpen(false);
      return;
    }
    if (!isManualValid) return; // guard: shouldn’t be clickable anyway
    const n = parseInt(intervalStr, 10);
    onChange({ freq, interval: clamp(n, bounds.min, bounds.max) });
    setOpen(false);
  };

  const onChangeIntervalText = (t: string) => {
    const digitsOnly = t.replace(/[^\d]/g, '');
    setIntervalStr(digitsOnly);
    const n = parseInt(digitsOnly, 10);
    if (Number.isFinite(n)) setInterval(clamp(n, bounds.min, bounds.max));
  };

  const pickInterval = (n: number) => {
    setInterval(n);
    setIntervalStr(String(n));
  };

  const changeFreq = (next: 'none' | 'weekly' | 'monthly') => {
    setFreq(next);
    if (next === 'none') return;
    const nextBounds = next === 'weekly' ? { min: 1, max: 52 } : { min: 1, max: 12 };
    const current = parseInt(intervalStr || '1', 10) || 1;
    const clamped = clamp(current, nextBounds.min, nextBounds.max);
    setInterval(clamped);
    setIntervalStr(String(clamped));
  };

  return (
    <>
      <SelectField
        label={label}
        value={(!!value && value.freq !== 'none' && formatRecurrence(value)) || ''}
        placeholder={'Pick recurrence (optional)'}
        selected={!!value && value.freq !== 'none'}
        leftIcon="repeat"
        onPress={openDialog}
        onClear={clear}
        fullWidth
      />

      <Portal>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Constants.statusBarHeight} // tweak depending on your header height
        >
          <Dialog visible={open} onDismiss={() => setOpen(false)} style={{ width: '90%', alignSelf: 'center' }}>
            <Dialog.Title>
              <ThemedText type="subtitle" className="text-center" onLight>
                {label}
              </ThemedText>
            </Dialog.Title>

            <Dialog.Content>
              {/* Frequency selector */}
              <SegmentedButtons
                value={freq}
                onValueChange={(v) => changeFreq(v as 'none' | 'weekly' | 'monthly')}
                buttons={[
                  { value: 'none', label: 'None', icon: 'close-circle-outline' },
                  { value: 'weekly', label: 'Weekly', icon: 'calendar-week' },
                  { value: 'monthly', label: 'Monthly', icon: 'calendar-month' }
                ]}
                density="small"
              />

              {/* Interval controls */}
              {showIntervalControls && (
                <View className="mt-2 gap-2">
                  <ThemedText onLight type="smallBold">
                    Suggested intervals {freq === 'weekly' ? '(weeks)' : '(months)'}
                  </ThemedText>
                  <View className="flex-row flex-wrap gap-2">
                    {suggested.map((n) => (
                      <Chip
                        key={n}
                        selected={interval === n}
                        showSelectedCheck={false}
                        onPress={() => pickInterval(n)}
                        style={
                          interval === n
                            ? {
                                backgroundColor: Colors.sway.bright
                              }
                            : {}
                        }
                      >
                        {n}
                      </Chip>
                    ))}
                  </View>
                  <View className="mt-2">
                    <ThemedText type="smallBold" onLight className="mb-1">
                      Other
                    </ThemedText>
                    <TextInput
                      mode="outlined"
                      keyboardType="number-pad"
                      inputMode="numeric"
                      returnKeyType="done"
                      label={freq === 'weekly' ? 'Weeks' : 'Months'}
                      value={intervalStr}
                      onChangeText={onChangeIntervalText}
                      right={<TextInput.Affix text={freq === 'weekly' ? 'wk' : 'mo'} />}
                      error={intervalStr.length > 0 && !isManualValid}
                    />
                    {!isManualValid && (
                      <ThemedText type="error">{`Enter a number between ${bounds.min} and ${bounds.max}.`}</ThemedText>
                    )}
                  </View>

                  {/* Live preview */}
                  <ThemedText onLight style={{ opacity: 0.7 }}>
                    To be completed {formatRecurrence({ freq, interval }).toLocaleLowerCase()}
                  </ThemedText>
                </View>
              )}
            </Dialog.Content>

            <Dialog.Actions style={{ justifyContent: 'space-between' }}>
              <Button onPress={() => setOpen(false)}>Cancel</Button>
              <View style={{ flexDirection: 'row' }}>
                <Button onPress={clear} style={{ marginRight: 8 }}>
                  Clear
                </Button>
                <Button mode="contained" onPress={save} disabled={freq !== 'none' && !isManualValid}>
                  Save
                </Button>
              </View>
            </Dialog.Actions>
          </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </>
  );
};

export default RecurrenceField;
export { formatRecurrence };
