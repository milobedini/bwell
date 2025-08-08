import { OpaqueColorValue, Pressable, PressableProps } from 'react-native';
import { Colors } from '@/constants/Colors';

import { IconSymbol, IconSymbolProps } from './IconSymbol';

type IconButtonProps = PressableProps &
  IconSymbolProps & {
    color?: string | OpaqueColorValue;
  };

const IconButton = ({ onPress, className, color, ...iconProps }: IconButtonProps) => {
  return (
    <Pressable onPress={onPress} className={className}>
      <IconSymbol color={color || Colors.sway.bright} {...iconProps} />
    </Pressable>
  );
};

export default IconButton;
