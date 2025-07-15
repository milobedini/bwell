import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { clsx } from 'clsx';

import { ThemedText } from './ThemedText';

const ThemedButton = (props: TouchableOpacityProps) => {
  const { className, children, disabled, ...rest } = props;
  return (
    <TouchableOpacity
      disabled={disabled}
      className={clsx('rounded-md bg-sway-bright p-4', disabled && 'bg-sway-darkGrey', className)}
      {...rest}
    >
      <ThemedText type="button" className="text-center">
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default ThemedButton;
