import { Platform } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

// Only use for screens without a visible header (headerShown: false).
// When a non-transparent header is shown, it already handles safe area — use ContentContainer instead.
type ContainerProps = SafeAreaViewProps & {
  centered?: boolean;
};

const Container = ({ children, className, centered, ...rest }: ContainerProps) => {
  return (
    <SafeAreaView
      edges={['top']}
      className={clsx('flex-1 bg-sway-dark', centered && 'items-center', Platform.OS === 'web' && 'pt-4', className)}
      {...rest}
    >
      {children}
    </SafeAreaView>
  );
};

export default Container;
