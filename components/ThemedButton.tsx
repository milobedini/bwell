import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { clsx } from 'clsx';

import { ThemedText } from './ThemedText';

type ThemedButtonProps = TouchableOpacityProps & {
  compact?: boolean;
};

const ThemedButton = (props: ThemedButtonProps) => {
  const { className, children, disabled, compact, ...rest } = props;
  return (
    <TouchableOpacity
      disabled={disabled}
      className={clsx(
        'rounded-md bg-sway-bright p-4',
        disabled && 'bg-sway-darkGrey',
        compact && 'self-start p-3',
        className
      )}
      {...rest}
    >
      <ThemedText type="button" className="text-center">
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default ThemedButton;
