import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { type TextInput as RNTextInput, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { clamp } from '@/utils/helpers';

type NumericFieldProps = {
  label: string;
  value?: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (n: number) => void;
  maxLength?: number;
  onFocus?: () => void;
  inputAccessoryViewID?: string;
};

const NumericField = memo(
  forwardRef<RNTextInput, NumericFieldProps>(function NumericField(
    { label, value, min, max, disabled, onChange, maxLength = 3, onFocus, inputAccessoryViewID },
    ref
  ) {
    const innerRef = useRef<RNTextInput>(null);

    // Expose focus() safely — innerRef may be null before mount
    useImperativeHandle(ref, () => ({ focus: () => innerRef.current?.focus() }) as RNTextInput);

    const [text, setText] = useState<string>(value == null ? '' : String(value));

    useEffect(() => {
      setText(value == null ? '' : String(value));
    }, [value]);

    const handleChange = useCallback(
      (t: string) => {
        // Allow empty while typing; filter to digits only
        const digits = t.replace(/[^\d]/g, '');
        setText(digits);

        // User still typing — don't emit until a number is present
        if (digits === '') return;
        const parsed = clamp(parseInt(digits, 10) || 0, min, max);
        if (parsed !== value) onChange(parsed);
      },
      [min, max, onChange, value]
    );

    const hasText = useMemo(() => text.length > 0, [text.length]);

    return (
      <View className="flex-row items-center justify-between px-2">
        <ThemedText>{label}</ThemedText>
        <TextInput
          ref={innerRef}
          mode="outlined"
          value={text}
          onChangeText={handleChange}
          onFocus={onFocus}
          disabled={disabled}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={maxLength}
          inputAccessoryViewID={inputAccessoryViewID}
          style={{
            backgroundColor: 'transparent',
            height: 44,
            textAlign: 'center'
          }}
          textColor="white"
          theme={{
            colors: {
              onSurfaceVariant: Colors.sway.lightGrey,
              surfaceDisabled: Colors.sway.darkGrey,
              onSurfaceDisabled: Colors.sway.darkGrey
            }
          }}
          placeholder={`${min}–${max}`}
          placeholderTextColor={Colors.sway.darkGrey}
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          outlineColor={hasText ? Colors.sway.bright : Colors.sway.darkGrey}
          activeOutlineColor={Colors.primary.accent}
        />
      </View>
    );
  })
);

NumericField.displayName = 'NumericField';

export default NumericField;
