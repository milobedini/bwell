import { BackButton } from '@/components/ui/BackButton';
import { Fonts } from '@/constants/Typography';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false
};

const stackScreenOptionsWithTitle = (title?: string): NativeStackNavigationOptions => {
  if (!title) return stackScreenOptions;
  return {
    headerShown: true,
    headerTransparent: true,
    headerTitle: title,
    headerTitleStyle: { color: 'white', fontFamily: Fonts.Bold, fontSize: 24 }
  };
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

type HeaderParams = { headerTitle?: string };

const withHeaderFromParams =
  () =>
  ({ route }: { route: RouteProp<ParamListBase, string> }): NativeStackNavigationOptions => {
    const { headerTitle } = (route.params as HeaderParams | undefined) ?? {};
    return {
      ...nestedScreenOptionsWithTitle(headerTitle),
      headerLeft: () => <BackButton />
    };
  };

export {
  nestedScreenOptions,
  nestedScreenOptionsWithTitle,
  stackScreenOptions,
  stackScreenOptionsWithTitle,
  withHeaderFromParams
};
