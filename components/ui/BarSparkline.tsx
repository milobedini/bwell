import { memo } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';

type BarSparklineProps = {
  values: number[];
  maxValue?: number;
  barCount?: number;
  maxHeight?: number;
};

const BarSparklineBase = ({ values, maxValue, barCount, maxHeight = 24 }: BarSparklineProps) => {
  const bars = barCount ? values.slice(-barCount) : values;
  const resolvedMax = Math.max(...bars, maxValue ?? 1, 1);

  return (
    <View className="flex-row items-end gap-0.5" style={{ height: maxHeight }}>
      {bars.map((value, index) => {
        const isLast = index === bars.length - 1;
        const height = Math.max(3, Math.round((value / resolvedMax) * maxHeight));
        return (
          <View
            key={index}
            style={{
              width: 4,
              height,
              borderRadius: 2,
              backgroundColor: isLast ? Colors.sway.bright : Colors.sway.darkGrey
            }}
          />
        );
      })}
    </View>
  );
};

const BarSparkline = memo(BarSparklineBase);

export default BarSparkline;
