import { OpaqueColorValue, Pressable, PressableProps } from 'react-native';
import { clsx } from 'clsx';
import { Colors } from '@/constants/Colors';

import { IconSymbol, IconSymbolProps } from './IconSymbol';

type IconButtonProps = PressableProps &
  IconSymbolProps & {
    color?: string | OpaqueColorValue;
  };

const IconButton = ({ onPress, className, color, disabled, ...iconProps }: IconButtonProps) => (
  <Pressable
    onPress={onPress}
    className={clsx(className, 'active:opacity-70 disabled:opacity-40')}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!disabled }}
  >
    <IconSymbol color={color || Colors.sway.bright} {...iconProps} />
  </Pressable>
);

export default IconButton;
