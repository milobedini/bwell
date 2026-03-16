import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import ToastManager from 'toastify-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FontsContainer from '@/components/FontsContainer';
import toastConfig from '@/components/toast/toastConfig';
import { Colors } from '@/constants/Colors';
import { getDeviceDatesLocaleKey, registerDatesTranslations } from '@/utils/locales';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import 'react-native-reanimated';

import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  }
});

const available = registerDatesTranslations();
const deviceDatesLocaleKey = getDeviceDatesLocaleKey(available);

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.sway.dark }}>
          <SafeAreaProvider>
            <PaperProvider>
              <FontsContainer>
                <Slot />
                <ToastManager config={toastConfig} />
              </FontsContainer>
            </PaperProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export { deviceDatesLocaleKey };
