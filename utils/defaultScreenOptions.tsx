import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Colors.sway.dark }
};

const nestedScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTransparent: true,
  headerBackButtonDisplayMode: 'minimal',
  headerTitle: '',
  headerStyle: { backgroundColor: Colors.sway.dark },
  headerShadowVisible: false,
  headerTintColor: Colors.sway.bright
};

const stackScreenOptionsWithTitle = (title?: string): NativeStackNavigationOptions => {
  if (!title) return stackScreenOptions;
  return {
    headerShown: true,
    headerTransparent: true,
    headerTitle: title,
    headerTitleStyle: { color: 'white', fontFamily: Fonts.Bold, fontSize: 24 },
    headerStyle: { backgroundColor: Colors.sway.dark },
    headerShadowVisible: false,
    headerTintColor: Colors.sway.bright,
    contentStyle: { backgroundColor: Colors.sway.dark }
  };
};

const nestedScreenOptionsWithTitle = (title?: string): NativeStackNavigationOptions => {
  if (!title) return nestedScreenOptions;
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
      ...nestedScreenOptionsWithTitle(headerTitle)
    };
  };

export {
  nestedScreenOptions,
  nestedScreenOptionsWithTitle,
  stackScreenOptions,
  stackScreenOptionsWithTitle,
  withHeaderFromParams
};
