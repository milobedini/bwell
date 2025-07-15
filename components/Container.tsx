import { Platform, SafeAreaView, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaViewProps } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

type ContainerProps = SafeAreaViewProps & {
  centered?: boolean;
};

const Container = ({ children, className, centered, ...rest }: ContainerProps) => {
  const topPadding = StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 12;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={['top']}
        className={clsx(
          'flex-1 bg-sway-dark px-3',
          centered && 'items-center',
          Platform.OS === 'web' && 'pt-4',
          className
        )}
        style={{ paddingTop: topPadding }}
        {...rest}
      >
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Container;
