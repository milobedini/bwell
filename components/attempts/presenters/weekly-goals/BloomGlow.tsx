import { memo, useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

// Increment `trigger` to fire a single bloom (in → hold → out). A counter
// instead of a boolean avoids external setTimeout juggling to reset it.
type BloomGlowProps = {
  trigger: number;
  size?: number;
  tint?: string;
  softTint?: string;
};

const BloomGlow = ({
  trigger,
  size = 92,
  tint = 'rgba(244,162,97,0.55)',
  softTint = 'rgba(231,111,154,0.25)'
}: BloomGlowProps) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (trigger === 0) return;
    if (reduceMotion) {
      opacity.value = withSequence(withTiming(0.9, { duration: 120 }), withTiming(0, { duration: 180 }));
      scale.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0.6, { duration: 180 }));
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 280 }),
      withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) })
    );
    scale.value = withSequence(
      withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200 }),
      withTiming(0.6, { duration: 420, easing: Easing.in(Easing.cubic) })
    );
  }, [trigger, reduceMotion, opacity, scale]);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.85,
    transform: [{ scale: scale.value * 0.65 }]
  }));

  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: softTint,
            shadowColor: Colors.diary.achievement,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 24
          },
          outerStyle
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: size * 0.3,
            backgroundColor: tint
          },
          innerStyle
        ]}
      />
    </View>
  );
};

export default memo(BloomGlow);
