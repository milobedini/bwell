import { Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

type ScrollContainerProps = SafeAreaViewProps & {
  centered?: boolean;
  contentClassName?: string;
  noPadding?: boolean;
};

const ScrollContainer = ({
  children,
  className,
  contentClassName,
  centered,
  noPadding,
  ...rest
}: ScrollContainerProps) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} className="flex-1 bg-sway-dark">
        <ScrollView
          className={clsx('flex-1 bg-sway-dark', !noPadding && 'px-4', className)}
          contentContainerStyle={{
            paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 12
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
