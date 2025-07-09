import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Container = ({ children }: { children: ReactNode }) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return <SafeAreaView className="flex-1 gap-4 bg-background p-4">{children}</SafeAreaView>;
  }

  return <View className="flex-1 gap-4 bg-background p-4">{children}</View>;
};

export default Container;
