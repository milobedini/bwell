import type { StyleProp, ViewStyle } from 'react-native';
import { FAB } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

type FabGroupAction = {
  icon: string;
  label: string;
  onPress: () => void;
  labelTextColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

type FabGroupProps = {
  open: boolean;
  visible: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  actions: FabGroupAction[];
};

const FabGroup = ({ open, visible, onOpenChange, actions, onDismiss }: FabGroupProps) => {
  return (
    <FAB.Group
      visible={visible}
      open={open}
      onStateChange={({ open }) => {
        if (!open) onDismiss();
        onOpenChange(open);
      }}
      icon={open ? 'close' : 'plus'}
      actions={actions}
      backdropColor="rgba(0,0,0,0.5)"
      onPress={() => {
        if (open) onDismiss();
      }}
      fabStyle={{ backgroundColor: Colors.primary.error }}
    />
  );
};

export default FabGroup;
export type { FabGroupAction, FabGroupProps };
