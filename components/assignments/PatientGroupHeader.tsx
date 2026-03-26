import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';

type PatientGroupHeaderProps = {
  patientName: string;
  assignmentCount: number;
  overdueCount: number;
  isExpanded: boolean;
  onToggle: () => void;
};

const PatientGroupHeaderBase = ({
  patientName,
  assignmentCount,
  overdueCount,
  isExpanded,
  onToggle
}: PatientGroupHeaderProps) => {
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(isExpanded ? '0deg' : '-90deg', { duration: 200 }) }]
  }));

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between rounded-t-xl px-4 py-3 active:opacity-80"
      style={{ backgroundColor: Colors.chip.darkCard }}
    >
      <View className="flex-1 flex-row items-center gap-2.5">
        <ThemedText type="smallTitle" numberOfLines={1} className="flex-shrink">
          {patientName}
        </ThemedText>

        <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: Colors.chip.pill }}>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
            {assignmentCount} active
          </ThemedText>
        </View>

        {overdueCount > 0 && (
          <View
            className="rounded-full border px-2.5 py-0.5"
            style={{
              backgroundColor: Colors.tint.error,
              borderColor: Colors.tint.errorBorder
            }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.error, fontSize: 12 }}>
              {overdueCount} overdue
            </ThemedText>
          </View>
        )}
      </View>

      <Animated.View style={chevronStyle}>
        <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.sway.darkGrey} />
      </Animated.View>
    </Pressable>
  );
};

const PatientGroupHeader = memo(PatientGroupHeaderBase);
export default PatientGroupHeader;
export type { PatientGroupHeaderProps };
