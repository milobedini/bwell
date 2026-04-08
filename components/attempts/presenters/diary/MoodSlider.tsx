import { memo, useCallback } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 24;
const HORIZONTAL_PADDING = 16;

type MoodSliderProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  disabled: boolean;
};

const MoodSlider = memo(({ value, onChange, disabled }: MoodSliderProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const trackWidth = screenWidth - HORIZONTAL_PADDING * 2;

  const translateX = useSharedValue(value !== undefined ? (value / 100) * trackWidth : 0);

  const commitValue = useCallback(
    (x: number) => {
      const clamped = Math.min(Math.max(x, 0), trackWidth);
      const mapped = Math.round((clamped / trackWidth) * 100);
      onChange(mapped);
    },
    [onChange, trackWidth]
  );

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      translateX.value = Math.min(Math.max(e.x, 0), trackWidth);
    })
    .onUpdate((e) => {
      translateX.value = Math.min(Math.max(e.x, 0), trackWidth);
    })
    .onEnd((e) => {
      const clamped = Math.min(Math.max(e.x, 0), trackWidth);
      runOnJS(commitValue)(clamped);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }]
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value
  }));

  if (disabled) {
    return (
      <View accessibilityLabel={value !== undefined ? `Mood: ${value}` : 'Mood: not set'} className="gap-1">
        <View className="flex-row items-center justify-between">
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            Mood
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.bright }}>
            {value !== undefined ? String(value) : '—'}
          </ThemedText>
        </View>
        <View style={[styles.track, { width: trackWidth }]}>
          <Svg width={trackWidth} height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="moodGradientView" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={Colors.diary.moodCool} />
                <Stop offset="1" stopColor={Colors.diary.moodWarm} />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={value !== undefined ? (value / 100) * trackWidth : 0}
              height={TRACK_HEIGHT}
              rx={TRACK_HEIGHT / 2}
              fill="url(#moodGradientView)"
            />
          </Svg>
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={value !== undefined ? `Mood slider, value ${value}` : 'Mood slider, not set'}
      className="gap-1"
    >
      <View className="flex-row items-center justify-between">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          Mood
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.bright }}>
          {value !== undefined ? String(value) : '—'}
        </ThemedText>
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={{ height: THUMB_SIZE, justifyContent: 'center' }}>
          <View style={[styles.track, { width: trackWidth }]}>
            <Svg width={trackWidth} height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="moodGradientEdit" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={Colors.diary.moodCool} />
                  <Stop offset="1" stopColor={Colors.diary.moodWarm} />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={trackWidth}
                height={TRACK_HEIGHT}
                rx={TRACK_HEIGHT / 2}
                fill="url(#moodGradientEdit)"
              />
            </Svg>
            <Animated.View style={[styles.fill, fillStyle]}>
              <Svg width={trackWidth} height={TRACK_HEIGHT}>
                <Defs>
                  <LinearGradient id="moodGradientFill" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={Colors.diary.moodCool} />
                    <Stop offset="1" stopColor={Colors.diary.moodWarm} />
                  </LinearGradient>
                </Defs>
                <Rect
                  x={0}
                  y={0}
                  width={trackWidth}
                  height={TRACK_HEIGHT}
                  rx={TRACK_HEIGHT / 2}
                  fill="url(#moodGradientFill)"
                />
              </Svg>
            </Animated.View>
          </View>
          {value !== undefined && <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none" />}
        </View>
      </GestureDetector>

      <View className="flex-row items-center justify-between">
        <ThemedText type="small" style={{ color: Colors.chip.dotInactive }}>
          Low
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.chip.dotInactive }}>
          High
        </ThemedText>
      </View>
    </View>
  );
});

MoodSlider.displayName = 'MoodSlider';

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.chip.pill,
    overflow: 'hidden'
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: TRACK_HEIGHT,
    overflow: 'hidden'
  },
  thumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.sway.bright,
    shadowColor: Colors.sway.bright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  }
});

export default MoodSlider;
