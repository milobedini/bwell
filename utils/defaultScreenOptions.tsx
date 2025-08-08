import { BackButton } from '@/components/ui/BackButton';
import { Fonts } from '@/constants/Typography';
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

const nestedScreenOptionsWithTitle = (title: string) => ({
  ...nestedScreenOptions,
  headerTitle: title,
  headerTitleStyle: { color: 'white', fontFamily: Fonts.Bold, fontSize: 24 }
});

export { nestedScreenOptions, nestedScreenOptionsWithTitle, stackScreenOptions };
