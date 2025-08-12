import { BackButton } from '@/components/ui/BackButton';
import { Fonts } from '@/constants/Typography';
import { ParamListBase, RouteProp } from '@react-navigation/native';
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

const nestedScreenOptionsWithTitle = (title?: string): NativeStackNavigationOptions => {
  if (!title) return stackScreenOptions;
  return {
    ...nestedScreenOptions,
    headerTitle: title,
    headerTitleStyle: { color: 'white', fontFamily: Fonts.Bold, fontSize: 24 }
  };
};

type HeaderTitleParamsShape = { headerTitle?: string };

export const withHeaderFromParams =
  () =>
  ({ route }: { route: RouteProp<ParamListBase, string>; navigation: any }) =>
    nestedScreenOptionsWithTitle((route.params as HeaderTitleParamsShape | undefined)?.headerTitle);

export { nestedScreenOptions, nestedScreenOptionsWithTitle, stackScreenOptions };
