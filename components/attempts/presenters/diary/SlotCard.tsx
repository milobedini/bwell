import { memo } from 'react';
import { TextInput as NativeTextInput, type TextInput as RNTextInput } from 'react-native';
import { Card, TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { FIELDS_PER_SLOT, moodColor, type SlotKey, type SlotValue } from '@/utils/activityHelpers';

import NumericField from './NumericField';

const DIARY_NAV_ID = 'diaryNav';

const NUMERIC_FIELDS = [
  { label: 'Mood', field: 'mood' as const, min: 0, max: 100, maxLength: 3 },
  { label: 'Achievement', field: 'achievement' as const, min: 0, max: 10, maxLength: 2 },
  { label: 'Closeness', field: 'closeness' as const, min: 0, max: 10, maxLength: 2 },
  { label: 'Enjoyment', field: 'enjoyment' as const, min: 0, max: 10, maxLength: 2 }
];

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

  return (
    <Card
      style={{
        backgroundColor: Colors.sway.buttonBackground,
        marginBottom: 10,
        marginHorizontal: 8,
        borderLeftWidth: 3,
        borderLeftColor: tintColor ?? 'transparent'
      }}
    >
      <Card.Title
        title={value.label}
        titleStyle={{ color: 'white', fontFamily: Fonts.Bold }}
        right={() =>
          tintColor && value.mood != null ? (
            <ThemedText style={{ fontSize: 11, color: tintColor, marginRight: 12 }}>mood {value.mood}</ThemedText>
          ) : null
        }
      />
      <Card.Content style={{ gap: 8 }}>
        <TextInput
          ref={getRefCallback(refKey(slotIdx, 0))}
          onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 0)}
          render={canEdit ? (props) => <NativeTextInput {...props} inputAccessoryViewID={DIARY_NAV_ID} /> : undefined}
          mode="flat"
          disabled={disabled}
          label={mode === 'edit' ? 'Activity' : undefined}
          placeholder={mode === 'edit' ? 'What did you do?' : undefined}
          placeholderTextColor={Colors.sway.darkGrey}
          value={value.activity}
          onChangeText={(t) => onUpdate(slotKey, { activity: t })}
          style={{ backgroundColor: 'transparent' }}
          className="overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
          textColor="white"
          underlineColor="transparent"
          activeUnderlineColor={Colors.sway.bright}
          theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
          clearButtonMode={mode === 'edit' ? 'always' : 'never'}
        />
        {NUMERIC_FIELDS.map((f, i) => (
          <NumericField
            key={f.field}
            ref={getRefCallback(refKey(slotIdx, i + 1))}
            onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + i + 1)}
            inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
            label={f.label}
            value={value[f.field]}
            min={f.min}
            max={f.max}
            maxLength={f.maxLength}
            disabled={disabled}
            onChange={(n) => onUpdate(slotKey, { [f.field]: n })}
          />
        ))}
      </Card.Content>
    </Card>
  );
};

export default memo(SlotCard);
