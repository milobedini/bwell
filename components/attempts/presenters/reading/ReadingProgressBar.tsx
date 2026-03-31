import { View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type ReadingProgressBarProps = {
  progress: SharedValue<number>; // 0 to 1
};

const ReadingProgressBar = ({ progress }: ReadingProgressBarProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value, 1) * 100}%`
  }));

  return (
    <View className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: Colors.chip.darkCard }}>
      <Animated.View className="h-1 rounded-full" style={[{ backgroundColor: Colors.sway.bright }, animatedStyle]} />
    </View>
  );
};

export default ReadingProgressBar;
