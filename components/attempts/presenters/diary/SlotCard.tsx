import { memo, useCallback, useMemo } from 'react';
import { type TextInput as RNTextInput } from 'react-native';
import { Card, TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { FIELDS_PER_SLOT, moodColor, type SlotKey, type SlotValue } from '@/utils/activityHelpers';

import NumericField from './NumericField';

const NUMERIC_FIELDS = [
  { label: 'Mood', field: 'mood' as const, min: 0, max: 100, maxLength: 3 },
  { label: 'Achievement', field: 'achievement' as const, min: 0, max: 10, maxLength: 2 },
  { label: 'Closeness', field: 'closeness' as const, min: 0, max: 10, maxLength: 2 },
  { label: 'Enjoyment', field: 'enjoyment' as const, min: 0, max: 10, maxLength: 2 }
];

const CARD_TITLE_STYLE = { color: 'white', fontFamily: Fonts.Bold } as const;
const ACTIVITY_STYLE = { backgroundColor: 'transparent' } as const;
const ACTIVITY_THEME = { colors: { onSurfaceVariant: Colors.sway.lightGrey } } as const;

type SlotCardProps = {
  slotKey: SlotKey;
  value: SlotValue;
  slotIdx: number;
  canEdit: boolean;
  mode: 'view' | 'edit';
  refKey: (slotIdx: number, fieldIdx: number) => string;
  getRefCallback: (key: string) => (r: RNTextInput | null) => void;
  setFocusedFieldIdx: (idx: number) => void;
  onUpdate: (key: SlotKey, patch: Partial<SlotValue>) => void;
};

const SlotCard = ({
  slotKey,
  value,
  slotIdx,
  canEdit,
  mode,
  refKey,
  getRefCallback,
  setFocusedFieldIdx,
  onUpdate
}: SlotCardProps) => {
  const disabled = !canEdit;
  const tintColor = moodColor(value.mood);

  const baseIdx = slotIdx * FIELDS_PER_SLOT;

  const handleActivityFocus = useCallback(() => setFocusedFieldIdx(baseIdx), [setFocusedFieldIdx, baseIdx]);
  const handleActivityChange = useCallback((t: string) => onUpdate(slotKey, { activity: t }), [onUpdate, slotKey]);

  const cardStyle = useMemo(
    () => ({
      backgroundColor: Colors.sway.buttonBackground,
      marginBottom: 10,
      marginHorizontal: 8,
      borderLeftWidth: 3,
      borderLeftColor: tintColor ?? 'transparent'
    }),
    [tintColor]
  );

  const moodBadge = useMemo(
    () =>
      tintColor && value.mood != null ? (
        <ThemedText style={{ fontSize: 11, color: tintColor, marginRight: 12 }}>mood {value.mood}</ThemedText>
      ) : null,
    [tintColor, value.mood]
  );

  return (
    <Card style={cardStyle}>
      <Card.Title title={value.label} titleStyle={CARD_TITLE_STYLE} right={() => moodBadge} />
      <Card.Content style={{ gap: 8 }}>
        <TextInput
          ref={getRefCallback(refKey(slotIdx, 0))}
          onFocus={handleActivityFocus}
          mode="flat"
          disabled={disabled}
          label={mode === 'edit' ? 'Activity' : undefined}
          placeholder={mode === 'edit' ? 'What did you do?' : undefined}
          placeholderTextColor={Colors.sway.darkGrey}
          value={value.activity}
          onChangeText={handleActivityChange}
          style={ACTIVITY_STYLE}
          className="overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
          textColor="white"
          underlineColor="transparent"
          activeUnderlineColor={Colors.sway.bright}
          theme={ACTIVITY_THEME}
          clearButtonMode={mode === 'edit' ? 'always' : 'never'}
        />
        {NUMERIC_FIELDS.map((f, i) => (
          <NumericField
            key={f.field}
            ref={getRefCallback(refKey(slotIdx, i + 1))}
            focusIdx={baseIdx + i + 1}
            setFocusedFieldIdx={setFocusedFieldIdx}
            slotKey={slotKey}
            field={f.field}
            label={f.label}
            value={value[f.field]}
            min={f.min}
            max={f.max}
            maxLength={f.maxLength}
            disabled={disabled}
            onUpdate={onUpdate}
          />
        ))}
      </Card.Content>
    </Card>
  );
};

const areSlotPropsEqual = (prev: SlotCardProps, next: SlotCardProps): boolean =>
  prev.slotKey === next.slotKey &&
  prev.slotIdx === next.slotIdx &&
  prev.canEdit === next.canEdit &&
  prev.mode === next.mode &&
  prev.onUpdate === next.onUpdate &&
  prev.setFocusedFieldIdx === next.setFocusedFieldIdx &&
  prev.getRefCallback === next.getRefCallback &&
  prev.value.activity === next.value.activity &&
  prev.value.mood === next.value.mood &&
  prev.value.achievement === next.value.achievement &&
  prev.value.closeness === next.value.closeness &&
  prev.value.enjoyment === next.value.enjoyment;

export default memo(SlotCard, areSlotPropsEqual);
