import { Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

type ScrollContainerProps = SafeAreaViewProps & {
  centered?: boolean;
  contentClassName?: string;
};

const ScrollContainer = ({ children, className, contentClassName, centered, ...rest }: ScrollContainerProps) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          className={clsx('flex-1 bg-background', className)}
          contentContainerStyle={{
            paddingTop: StatusBar.currentHeight
          }}
          contentContainerClassName={clsx(
            contentClassName,
            centered && 'items-center',
            Platform.OS === 'web' && 'pt-4'
          )}
          {...rest}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ScrollContainer;
