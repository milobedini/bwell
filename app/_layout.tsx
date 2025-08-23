import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import ToastManager from 'toastify-react-native';
import FontsContainer from '@/components/FontsContainer';
import toastConfig from '@/components/toast/toastConfig';
import { Colors } from '@/constants/Colors';
import { getDeviceDatesLocaleKey, registerDatesTranslations } from '@/utils/locales';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import 'react-native-reanimated';

import '../global.css';

const queryClient = new QueryClient();

const available = registerDatesTranslations();
const deviceDatesLocaleKey = getDeviceDatesLocaleKey(available);

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export { deviceDatesLocaleKey };
