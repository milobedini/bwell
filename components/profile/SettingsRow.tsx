import { type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type SettingsRowProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  trailing?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  testID?: string;
};

const SettingsRow = ({ icon, label, trailing, onPress, destructive, showChevron = true, testID }: SettingsRowProps) => {
  const colour = destructive ? Colors.primary.error : Colors.sway.lightGrey;
  const iconColour = destructive ? Colors.primary.error : Colors.sway.darkGrey;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 active:opacity-70"
      disabled={!onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name={icon} size={20} color={iconColour} style={{ marginRight: 12 }} />

      <View className="flex-1">
        <ThemedText type="default" style={{ color: colour, fontSize: 16, lineHeight: 22 }}>
          {label}
        </ThemedText>
      </View>

      {trailing && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginRight: 8 }}>
          {trailing}
        </ThemedText>
      )}

      {onPress && showChevron && <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.sway.darkGrey} />}
    </Pressable>
  );
};

export default SettingsRow;
