import { Platform, SafeAreaView } from 'react-native';
import { SafeAreaViewProps } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

type ContainerProps = SafeAreaViewProps & {
  centered?: boolean;
};

const Container = ({ children, className, centered, ...rest }: ContainerProps) => {
  return (
    <SafeAreaView
      edges={['top']}
      className={clsx(
        'flex-1 bg-sway-dark px-3',
        centered && 'items-center',
        Platform.OS === 'web' && 'pt-4',
        className
      )}
      {...rest}
    >
      {children}
    </SafeAreaView>
  );
};

export default Container;
