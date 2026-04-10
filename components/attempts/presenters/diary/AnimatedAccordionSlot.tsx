import { type PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';

const EXPAND_DURATION = 250;
const CONTENT_FADE_DELAY = 50;

type AnimatedAccordionSlotProps = PropsWithChildren<{
  isExpanded: boolean;
}>;

/**
 * Wraps accordion content with a height/opacity animation.
 *
 * When collapsed the wrapper renders at height 0 with overflow hidden.
 * When expanded it measures the content via onLayout and animates to the
 * measured height over 250ms, with content fading in after a 50ms delay.
 */
const AnimatedAccordionSlot = ({ isExpanded, children }: AnimatedAccordionSlotProps) => {
  const shouldReduceMotion = useReducedMotion();
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      animatedHeight.value = isExpanded ? contentHeight.value : 0;
      opacity.value = isExpanded ? 1 : 0;
      return;
    }

    if (isExpanded) {
      animatedHeight.value = withTiming(contentHeight.value, { duration: EXPAND_DURATION });
      opacity.value = withDelay(CONTENT_FADE_DELAY, withTiming(1, { duration: EXPAND_DURATION - CONTENT_FADE_DELAY }));
    } else {
      opacity.value = withTiming(0, { duration: EXPAND_DURATION / 2 });
      animatedHeight.value = withTiming(0, { duration: EXPAND_DURATION });
    }
  }, [isExpanded, contentHeight, animatedHeight, opacity, shouldReduceMotion]);

  // Re-sync animated height when content size changes while expanded
  const handleLayout = (height: number) => {
    contentHeight.value = height;
    if (isExpanded) {
      animatedHeight.value = shouldReduceMotion ? height : withTiming(height, { duration: EXPAND_DURATION });
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: opacity.value,
    overflow: 'hidden' as const
  }));

  return (
    <Animated.View style={containerStyle}>
      <View onLayout={(e) => handleLayout(e.nativeEvent.layout.height)} style={{ position: 'absolute', width: '100%' }}>
        {children}
      </View>
    </Animated.View>
  );
};

export default AnimatedAccordionSlot;
