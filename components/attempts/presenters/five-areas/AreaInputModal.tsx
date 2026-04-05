import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Keyboard, Pressable, TextInput, useWindowDimensions, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import KeyboardAvoidingWrapper from '@/components/ui/KeyboardAvoidingWrapper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { AREA_HINTS, AREA_KEYS, AREA_LABELS, type AreaKey } from './useFiveAreasState';

// Mirror of node positions from FiveAreasDiagram (viewbox coordinates)
const NODE_POSITIONS = [
  { x: 160, y: 36 }, // situation
  { x: 75, y: 115 }, // thoughts
  { x: 245, y: 115 }, // emotions
  { x: 75, y: 205 }, // physical
  { x: 245, y: 205 }, // behaviours
  { x: 160, y: 260 } // reflection
];
const VB_W = 320;
const CANVAS_H_PAD = 32;
const MAX_CANVAS_W = 420;
const DIAGRAM_PX_PAD = 16; // px-4 on diagram container
const DIAGRAM_PT_PAD = 8; // pt-2 on diagram container
const TITLE_FINAL_Y = 24; // approximate Y center of the title in its final position

type AreaInputModalProps = {
  areaKey: AreaKey;
  currentStep: number;
  value: string;
  onChangeText: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  isSaving: boolean;
};

const AreaInputModal = ({
  areaKey,
  currentStep,
  value,
  onChangeText,
  onNext,
  onBack,
  onClose,
  isSaving
}: AreaInputModalProps) => {
  const inputRef = useRef<TextInput>(null);
  const { width: screenWidth } = useWindowDimensions();
  const isReflection = areaKey === 'reflection';
  const accentColor = isReflection ? Colors.primary.info : Colors.sway.bright;
  const isLastStep = currentStep === AREA_KEYS.length - 1;

  // Compute where the node label is on screen so the title can fly from there
  const { fromX, fromY } = useMemo(() => {
    const canvasWidth = Math.min(screenWidth - CANVAS_H_PAD, MAX_CANVAS_W);
    const scale = canvasWidth / VB_W;
    const node = NODE_POSITIONS[currentStep];
    const nodeScreenX = DIAGRAM_PX_PAD + node.x * scale;
    const nodeScreenY = DIAGRAM_PT_PAD + node.y * scale;
    const titleCenterX = screenWidth / 2;
    return {
      fromX: nodeScreenX - titleCenterX,
      fromY: nodeScreenY - TITLE_FINAL_Y
    };
  }, [currentStep, screenWidth]);

  // Auto-focus input after fly-in animation
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, [areaKey]);

  const handleSubmitEditing = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <KeyboardAvoidingWrapper>
      <View className="px-4">
        {/* Title — flies in from node position on first render, cross-fades on step change */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={areaKey}
            from={{ opacity: 0, translateX: fromX, translateY: fromY, scale: 0.5 }}
            animate={{ opacity: 1, translateX: 0, translateY: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'timing', duration: 350 }}
          >
            <View className="pb-1 pt-3">
              {/* Back to diagram button */}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="absolute right-0 top-3 z-10 flex-row items-center gap-1 rounded-full px-2 py-1"
                style={{ backgroundColor: Colors.chip.pill }}
              >
                <MaterialCommunityIcons name="graph-outline" size={16} color={Colors.sway.darkGrey} />
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  Map
                </ThemedText>
              </Pressable>

              <View className="items-center">
                <ThemedText type="subtitle" style={{ color: accentColor }}>
                  {AREA_LABELS[areaKey]}
                </ThemedText>
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
                  {currentStep + 1} of {AREA_KEYS.length}
                </ThemedText>
              </View>
            </View>
          </MotiView>
        </AnimatePresence>

        {/* Input — fades in after title */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={areaKey}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
          >
            <TextInput
              ref={inputRef}
              className="rounded-xl p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                color: Colors.sway.lightGrey,
                fontFamily: Fonts.Regular,
                fontSize: 18,
                textAlignVertical: 'top',
                minHeight: 120,
                maxHeight: 280,
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

        {/* Navigation buttons — slide up with input */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 150 }}
        >
          <View className="flex-row gap-3 pb-4 pt-3">
            <ThemedButton className="flex-1" variant="outline" title="Back" onPress={onBack} disabled={isSaving} />
            <ThemedButton
              className="flex-1"
              title={isLastStep ? 'Review' : 'Next'}
              onPress={onNext}
              disabled={isSaving || !value.trim()}
            />
          </View>
        </MotiView>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

export default AreaInputModal;
