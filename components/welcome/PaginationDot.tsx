import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

import { welcomeConstants } from './WelcomeConstants';

type PaginationDotProps = {
  scrollY: { value: number };
  index: number;
};

export const PaginationDot = ({ scrollY, index }: PaginationDotProps) => {
  const styles = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [index - 1, index, index + 1],
        [welcomeConstants.indicatorSize, welcomeConstants.indicatorSize * 6, welcomeConstants.indicatorSize],
        Extrapolation.CLAMP
      )
    };
  });
  return (
    <Animated.View
      style={[
        {
          width: welcomeConstants.indicatorSize,
          height: welcomeConstants.indicatorSize,
          borderRadius: welcomeConstants.indicatorSize / 2,
          backgroundColor: Colors.primary.accent,
          marginBottom: welcomeConstants.indicatorSize / 2
        },
        styles
      ]}
    />
  );
};
