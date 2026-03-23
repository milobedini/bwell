import { InputAccessoryView, Keyboard, Platform, Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type DiaryInputToolbarProps = {
  nativeID: string;
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const ARROW_HIT_SLOP = { top: 8, bottom: 8, left: 12, right: 12 };

const DiaryInputToolbar = ({ nativeID, label, canGoPrev, canGoNext, onPrev, onNext }: DiaryInputToolbarProps) => {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: Colors.chip.darkCard,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: Colors.sway.darkGrey
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable
            onPress={onPrev}
            disabled={!canGoPrev}
            hitSlop={ARROW_HIT_SLOP}
            accessibilityLabel="Previous field"
            accessibilityRole="button"
          >
            <ThemedText
              style={{
                fontSize: 22,
                fontFamily: Fonts.Bold,
                color: canGoPrev ? Colors.sway.bright : Colors.sway.darkGrey
              }}
            >
              {'‹'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={onNext}
            disabled={!canGoNext}
            hitSlop={ARROW_HIT_SLOP}
            accessibilityLabel="Next field"
            accessibilityRole="button"
          >
            <ThemedText
              style={{
                fontSize: 22,
                fontFamily: Fonts.Bold,
                color: canGoNext ? Colors.sway.bright : Colors.sway.darkGrey
              }}
            >
              {'›'}
            </ThemedText>
          </Pressable>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {label}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          hitSlop={ARROW_HIT_SLOP}
          accessibilityLabel="Dismiss keyboard"
          accessibilityRole="button"
        >
          <ThemedText style={{ fontFamily: Fonts.Bold, color: Colors.sway.bright }}>Done</ThemedText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
};

export default DiaryInputToolbar;
