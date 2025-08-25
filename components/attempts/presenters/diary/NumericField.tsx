import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { clamp } from '@/utils/helpers';

const NumericField = memo(function NumericField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
  maxLength = 3
}: {
  label: string;
  value?: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (n: number) => void;
  maxLength?: number;
}) {
  const [text, setText] = useState<string>(value == null ? '' : String(value));

  useEffect(() => {
    setText(value == null ? '' : String(value));
  }, [value]);

  const handleChange = useCallback(
    (t: string) => {
      // allow empty while typing; filter to digits only
      const digits = t.replace(/[^\d]/g, '');
      setText(digits);

      if (digits === '') return; // user still typing
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
        mode="outlined"
        value={text}
        onChangeText={handleChange}
        disabled={disabled}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={maxLength}
        style={{
          backgroundColor: 'transparent',
          height: 32,
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
});

export default NumericField;
