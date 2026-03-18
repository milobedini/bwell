import { OpaqueColorValue, Pressable, PressableProps } from 'react-native';
import { Colors } from '@/constants/Colors';

import { IconSymbol, IconSymbolProps } from './IconSymbol';

type IconButtonProps = PressableProps &
  IconSymbolProps & {
    color?: string | OpaqueColorValue;
  };

const IconButton = ({ onPress, className, color, disabled, ...iconProps }: IconButtonProps) => (
  <Pressable
    onPress={onPress}
    className={className}
    disabled={disabled}
    style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!disabled }}
  >
    <IconSymbol color={color || Colors.sway.bright} {...iconProps} />
  </Pressable>
);

export default IconButton;
