import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { type TextInput as RNTextInput, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { type SlotKey, type SlotValue } from '@/utils/activityHelpers';
import { clamp } from '@/utils/helpers';

type NumericFieldProps = {
  label: string;
  value?: number;
  min: number;
  max: number;
  disabled?: boolean;
  maxLength?: number;
  focusIdx: number;
  setFocusedFieldIdx: (idx: number) => void;
  slotKey: SlotKey;
  field: keyof Pick<SlotValue, 'mood' | 'achievement' | 'closeness' | 'enjoyment'>;
  onUpdate: (key: SlotKey, patch: Partial<SlotValue>) => void;
};

const THEME = {
  colors: {
    onSurfaceVariant: Colors.sway.lightGrey,
    surfaceDisabled: Colors.sway.darkGrey,
    onSurfaceDisabled: Colors.sway.darkGrey
  }
} as const;

const INPUT_STYLE = { backgroundColor: 'transparent', height: 44, textAlign: 'center' } as const;

const NumericField = memo(
  forwardRef<RNTextInput, NumericFieldProps>(function NumericField(
    { label, value, min, max, disabled, maxLength = 3, focusIdx, setFocusedFieldIdx, slotKey, field, onUpdate },
    ref
  ) {
    const innerRef = useRef<RNTextInput>(null);

    // Expose focus() safely — innerRef may be null before mount
    useImperativeHandle(ref, () => ({ focus: () => innerRef.current?.focus() }) as RNTextInput);

    const [text, setText] = useState<string>(value == null ? '' : String(value));

    useEffect(() => {
      setText(value == null ? '' : String(value));
    }, [value]);

    const handleFocus = useCallback(() => setFocusedFieldIdx(focusIdx), [setFocusedFieldIdx, focusIdx]);

    const handleChange = useCallback(
      (t: string) => {
        // Allow empty while typing; filter to digits only
        const digits = t.replace(/[^\d]/g, '');
        setText(digits);

        // User still typing — don't emit until a number is present
        if (digits === '') return;
        const parsed = clamp(parseInt(digits, 10) || 0, min, max);
        if (parsed !== value) onUpdate(slotKey, { [field]: parsed });
      },
      [min, max, onUpdate, value, slotKey, field]
    );

    return (
      <View className="flex-row items-center justify-between px-2">
        <ThemedText>{label}</ThemedText>
        <TextInput
          ref={innerRef}
          mode="outlined"
          value={text}
          onChangeText={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={maxLength}
          style={INPUT_STYLE}
          textColor="white"
          theme={THEME}
          placeholder={`${min}–${max}`}
          placeholderTextColor={Colors.sway.darkGrey}
          submitBehavior="blurAndSubmit"
          outlineColor={text.length > 0 ? Colors.sway.bright : Colors.sway.darkGrey}
          activeOutlineColor={Colors.primary.accent}
        />
      </View>
    );
  })
);

NumericField.displayName = 'NumericField';

export default NumericField;
