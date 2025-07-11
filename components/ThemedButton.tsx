import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { ThemedText } from './ThemedText';

const ThemedButton = (props: TouchableOpacityProps) => {
  const { children, ...rest } = props;
  return (
    <TouchableOpacity className="bg-sway-bright rounded-md p-4" {...rest}>
      <ThemedText type="button" className="text-center">
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default ThemedButton;
