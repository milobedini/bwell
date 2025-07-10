import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

type ContentContainerProps = ViewProps & {
  centered?: boolean;
};

const ContentContainer = ({ children, className, centered, ...rest }: ContentContainerProps) => {
  return (
    <View className={clsx('w-full flex-1 px-2', centered && 'items-center', className)} {...rest}>
      {children}
    </View>
  );
};

export default ContentContainer;
