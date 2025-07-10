import { Platform, SafeAreaView, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaViewProps } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

type ContainerProps = SafeAreaViewProps & {
  centered?: boolean;
};

const Container = ({ children, className, centered, ...rest }: ContainerProps) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={['top']}
        className={clsx(
          `p-t-[${StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 12}] flex-1 bg-background px-3`,
          className,
          centered && 'items-center',
          Platform.OS === 'web' && 'pt-4'
        )}
        {...rest}
      >
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Container;
