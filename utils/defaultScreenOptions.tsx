import { BackButton } from '@/components/ui/BackButton';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false
};

const nestedScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTransparent: true,
  headerLeft: () => <BackButton />,
  headerTitle: ''
};

export { nestedScreenOptions, stackScreenOptions };
