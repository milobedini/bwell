import { Keyboard, Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import MaterialIcons from '@react-native-vector-icons/material-icons';

type DiaryInputToolbarProps = {
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const CHEVRON_SIZE = 24;
const HIT_SLOP = { top: 8, bottom: 8, left: 12, right: 12 };

const DiaryInputToolbar = ({ label, canGoPrev, canGoNext, onPrev, onNext }: DiaryInputToolbarProps) => (
  <View className="flex-row items-center justify-between border-t border-sway-darkGrey bg-chip-darkCard px-2 py-1.5">
    <View className="flex-row items-center gap-1">
      <Pressable
        onPress={onPrev}
        disabled={!canGoPrev}
        hitSlop={HIT_SLOP}
        className="items-center justify-center rounded-md p-1.5 active:opacity-50"
        accessibilityLabel="Previous field"
        accessibilityRole="button"
      >
        <MaterialIcons
          name="keyboard-arrow-up"
          size={CHEVRON_SIZE}
          color={canGoPrev ? Colors.sway.bright : Colors.sway.darkGrey}
        />
      </Pressable>
      <Pressable
        onPress={onNext}
        disabled={!canGoNext}
        hitSlop={HIT_SLOP}
        className="items-center justify-center rounded-md p-1.5 active:opacity-50"
        accessibilityLabel="Next field"
        accessibilityRole="button"
      >
        <MaterialIcons
          name="keyboard-arrow-down"
          size={CHEVRON_SIZE}
          color={canGoNext ? Colors.sway.bright : Colors.sway.darkGrey}
        />
      </Pressable>
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginLeft: 4 }}>
        {label}
      </ThemedText>
    </View>
    <Pressable
      onPress={() => Keyboard.dismiss()}
      hitSlop={HIT_SLOP}
      className="rounded-md px-2 py-1.5 active:opacity-50"
      accessibilityLabel="Dismiss keyboard"
      accessibilityRole="button"
    >
      <ThemedText style={{ fontFamily: Fonts.Bold, color: Colors.sway.bright }}>Done</ThemedText>
    </Pressable>
  </View>
);

export default DiaryInputToolbar;
