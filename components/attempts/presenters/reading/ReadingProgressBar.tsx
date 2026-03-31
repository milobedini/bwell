import { View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type ReadingProgressBarProps = {
  progress: SharedValue<number>; // 0 to 1
};

const ReadingProgressBar = ({ progress }: ReadingProgressBarProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
  }));

  return (
    <View className="h-[3px] w-full" style={{ backgroundColor: Colors.chip.darkCard }}>
      <Animated.View
        className="h-full rounded-r-full"
        style={[{ backgroundColor: Colors.sway.bright }, animatedStyle]}
      />
    </View>
  );
};

export default ReadingProgressBar;
