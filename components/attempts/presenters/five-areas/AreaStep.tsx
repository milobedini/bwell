import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import useToggle from '@/hooks/useToggle';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { AREA_HINTS, AREA_LABELS, type AreaKey } from './useFiveAreasState';

type AreaStepProps = {
  areaKey: AreaKey;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
};

const AreaStep = ({ areaKey, value, onChangeText, editable }: AreaStepProps) => {
  const [hintVisible, toggleHint] = useToggle(true);
  const label = AREA_LABELS[areaKey];
  const hint = AREA_HINTS[areaKey];
  const isReflection = areaKey === 'reflection';

  return (
    <View className="flex-1 px-4">
      <View className="mb-2 flex-row items-center justify-between">
        <ThemedText type="subtitle" style={{ color: isReflection ? Colors.primary.info : Colors.sway.bright }}>
          {label}
        </ThemedText>

        {editable && (
          <Pressable onPress={toggleHint} hitSlop={12}>
            <MaterialCommunityIcons
              name={hintVisible ? 'lightbulb-on-outline' : 'lightbulb-outline'}
              size={20}
              color={Colors.sway.darkGrey}
            />
          </Pressable>
        )}
      </View>

      {hintVisible && editable && (
        <View className="mb-3 rounded-lg px-3 py-2" style={{ backgroundColor: Colors.chip.pill }}>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {hint}
          </ThemedText>
        </View>
      )}

      <TextInput
        className="flex-1 rounded-xl p-4"
        style={{
          backgroundColor: Colors.chip.darkCard,
          color: Colors.sway.lightGrey,
          fontFamily: 'Lato-Regular',
          fontSize: 16,
          textAlignVertical: 'top',
          minHeight: 120,
          borderWidth: 1,
          borderColor: Colors.chip.darkCardAlt
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={AREA_HINTS[areaKey]}
        placeholderTextColor={Colors.sway.darkGrey}
        multiline
        editable={editable}
        scrollEnabled
      />
    </View>
  );
};

export default AreaStep;
