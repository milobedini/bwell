import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

// Use for screens with a visible header or inside tab navigators that already handle safe area.
// For headerless screens, use Container instead.
type ContentContainerProps = ViewProps & {
  centered?: boolean;
};

const ContentContainer = ({ children, className, centered, ...rest }: ContentContainerProps) => {
  return (
    <View className={clsx('flex-1 bg-sway-dark px-4', centered && 'items-center', className)} {...rest}>
      {children}
    </View>
  );
};

export default ContentContainer;
