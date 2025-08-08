import { FAB } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

type FabTriggerProps = {
  icon?: string;
  color?: string;
  backgroundColor?: string;
  elevation?: number;
  onPress: () => void;
};

const FabTrigger = ({
  icon = 'plus',
  color = 'white',
  backgroundColor = Colors.sway.bright,
  elevation = 2,
  onPress
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
    />
  );
};

export default FabTrigger;
export type { FabTriggerProps };
