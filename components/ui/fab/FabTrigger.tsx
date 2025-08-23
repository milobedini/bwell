import { FAB, FABProps } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

type FabTriggerProps = {
  icon?: string;
  color?: string;
  backgroundColor?: string;
  elevation?: number;
  onPress: () => void;
  size?: FABProps['size'];
};

const FabTrigger = ({
  icon = 'plus',
  color = 'white',
  backgroundColor = Colors.sway.bright,
  elevation = 2,
  onPress,
  size = 'medium'
}: FabTriggerProps) => {
  return (
    <FAB
      icon={icon}
      color={color}
      onPress={onPress}
      style={{
        backgroundColor,
        elevation
      }}
      size={size}
    />
  );
};

export default FabTrigger;
export type { FabTriggerProps };
