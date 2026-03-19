import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

// Use for screens with a visible header or inside tab navigators that already handle safe area.
// For headerless screens, use Container instead.
type ContentContainerProps = ViewProps & {
  centered?: boolean;
  padded?: boolean;
};

const ContentContainer = ({ children, className, centered, padded = true, ...rest }: ContentContainerProps) => {
  return (
    <View className={clsx('flex-1 bg-sway-dark', padded && 'px-4', centered && 'items-center', className)} {...rest}>
      {children}
    </View>
  );
};

export default ContentContainer;
