import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import KeyboardAvoidingWrapper from '@/components/ui/KeyboardAvoidingWrapper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import useToggle from '@/hooks/useToggle';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { AREA_HINTS, AREA_KEYS, AREA_LABELS, type AreaKey } from './useFiveAreasState';

type AreaInputModalProps = {
  areaKey: AreaKey;
  currentStep: number;
  value: string;
  onChangeText: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
};

const AreaInputModal = ({
  areaKey,
  currentStep,
  value,
  onChangeText,
  onNext,
  onBack,
  isSaving
}: AreaInputModalProps) => {
  const [hintManuallyHidden, , setHintManuallyHidden] = useToggle(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isReflection = areaKey === 'reflection';
  const accentColor = isReflection ? Colors.primary.info : Colors.sway.bright;
  const isLastStep = currentStep === AREA_KEYS.length - 1;

  const hintVisible = !hintManuallyHidden && !keyboardOpen;
  const toggleHint = useCallback(() => setHintManuallyHidden((prev) => !prev), [setHintManuallyHidden]);

  // Auto-focus input when area changes
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [areaKey]);

  // Track keyboard state to auto-hide hint
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmitEditing = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <KeyboardAvoidingWrapper>
      <View className="flex-1 px-4">
        {/* Title */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={areaKey}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            <View className="items-center pb-1 pt-3">
              <ThemedText type="subtitle" style={{ color: accentColor }}>
                {AREA_LABELS[areaKey]}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
                {currentStep + 1} of {AREA_KEYS.length}
              </ThemedText>
            </View>
          </MotiView>
        </AnimatePresence>

        {/* Hint */}
        {hintVisible && (
          <Pressable
            onPress={toggleHint}
            className="mb-2 mt-2 flex-row items-center rounded-lg px-3 py-2"
            style={{ backgroundColor: Colors.chip.pill }}
          >
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={Colors.sway.darkGrey} />
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginLeft: 6, flex: 1 }}>
              {AREA_HINTS[areaKey]}
            </ThemedText>
          </Pressable>
        )}

        {/* Input */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={areaKey}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            style={{ flex: 1 }}
          >
            <TextInput
              ref={inputRef}
              className="flex-1 rounded-xl p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                color: Colors.sway.lightGrey,
                fontFamily: Fonts.Regular,
                fontSize: 18,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: Colors.chip.darkCardAlt
              }}
              value={value}
              onChangeText={onChangeText}
              placeholder={AREA_HINTS[areaKey]}
              placeholderTextColor={Colors.sway.darkGrey}
              multiline
              scrollEnabled
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={handleSubmitEditing}
            />
          </MotiView>
        </AnimatePresence>

        {/* Navigation buttons */}
        <View className="flex-row gap-3 pb-4 pt-3">
          <ThemedButton className="flex-1" variant="outline" title="Back" onPress={onBack} disabled={isSaving} />
          <ThemedButton
            className="flex-1"
            title={isLastStep ? 'Review' : 'Next'}
            onPress={onNext}
            disabled={isSaving || !value.trim()}
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

export default AreaInputModal;
