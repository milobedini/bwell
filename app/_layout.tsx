import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

if (process.env.EXPO_PUBLIC_E2E === 'true') {
  LogBox.ignoreAllLogs();
}
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import { Toaster } from 'sonner-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FontsContainer from '@/components/FontsContainer';
import { Colors } from '@/constants/Colors';
import { getDeviceDatesLocaleKey, registerDatesTranslations } from '@/utils/locales';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import 'react-native-reanimated';

import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  }
});

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    surface: Colors.sway.dark,
    surfaceVariant: Colors.sway.buttonBackgroundSolid,
    surfaceContainerHigh: Colors.chip.darkCard,
    surfaceContainerHighest: Colors.chip.darkCardAlt,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level3: Colors.chip.darkCard
    },
    onSurface: Colors.sway.lightGrey,
    onSurfaceVariant: Colors.sway.darkGrey,
    secondaryContainer: Colors.sway.buttonBackgroundSolid,
    onSecondaryContainer: Colors.sway.bright,
    outline: Colors.sway.buttonBackgroundSolid,
    primary: Colors.sway.bright,
    onPrimary: Colors.sway.dark
  }
};

const available = registerDatesTranslations();
const deviceDatesLocaleKey = getDeviceDatesLocaleKey(available);

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.sway.dark }}>
          <SafeAreaProvider>
            <PaperProvider theme={paperTheme}>
              <FontsContainer>
                <Slot />
                <Toaster
                  position="top-center"
                  offset={60}
                  toastOptions={{
                    style: {
                      backgroundColor: Colors.sway.dark
                    },
                    titleStyle: {
                      color: Colors.primary.white,
                      fontFamily: 'SpaceGrotesk-SemiBold'
                    },
                    descriptionStyle: {
                      color: Colors.sway.darkGrey,
                      fontFamily: 'SpaceGrotesk-Regular'
                    }
                  }}
                />
              </FontsContainer>
            </PaperProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export { deviceDatesLocaleKey };
