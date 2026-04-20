import { memo, type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';

// Call `ref.current.bloom()` to fire a single celebratory bloom (ease out →
// ease out). The Skia radial gradient gives a proper soft falloff instead of
// hard-edged circles; scale and opacity are driven by Reanimated on the native
// thread.
export type BloomBurstHandle = {
  bloom: () => void;
};

type BloomBurstProps = {
  ref?: Ref<BloomBurstHandle>;
  size?: number;
  colors?: readonly [string, string, string];
};

const DEFAULT_COLORS = [Colors.bloom.tealCore, Colors.bloom.tealMid, Colors.bloom.tealEdge] as const;

const BloomBurst = ({ ref, size = 96, colors = DEFAULT_COLORS }: BloomBurstProps) => {
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        reduceMotionRef.current = v;
      })
      .catch(() => {
        reduceMotionRef.current = false;
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reduceMotionRef.current = v;
    });
    return () => sub.remove();
  }, []);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useImperativeHandle(
    ref,
    () => ({
      bloom: () => {
        if (reduceMotionRef.current) {
          opacity.value = withSequence(withTiming(0.7, { duration: 120 }), withTiming(0, { duration: 200 }));
          scale.value = withSequence(withTiming(1, { duration: 120 }), withTiming(1.1, { duration: 200 }));
          return;
        }
        opacity.value = withSequence(
          withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 680, easing: Easing.in(Easing.cubic) })
        );
        scale.value = withSequence(
          withTiming(1.1, { duration: 520, easing: Easing.out(Easing.cubic) }),
          withTiming(1.55, { duration: 460, easing: Easing.in(Easing.cubic) })
        );
      }
    }),
    [opacity, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const half = size / 2;

  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Canvas style={{ width: size, height: size }}>
          <Circle cx={half} cy={half} r={half}>
            <RadialGradient c={vec(half, half)} r={half} colors={[...colors]} positions={[0, 0.45, 1]} />
          </Circle>
        </Canvas>
      </Animated.View>
    </View>
  );
};

const MemoBloomBurst = memo(BloomBurst);
MemoBloomBurst.displayName = 'BloomBurst';
export default MemoBloomBurst;
