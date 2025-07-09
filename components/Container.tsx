import type { ReactNode } from 'react';
import { View } from 'react-native';

const Container = ({ children }: { children: ReactNode }) => {
  return <View className="flex-1 gap-4 bg-background p-4">{children}</View>;
};

export default Container;
