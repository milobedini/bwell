import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import ToastManager from 'toastify-react-native';
import FontsContainer from '@/components/FontsContainer';
import toastConfig from '@/components/toast/toastConfig';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import 'react-native-reanimated';

import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <PaperProvider>
          <FontsContainer>
            <Slot />
            <ToastManager config={toastConfig} />
          </FontsContainer>
        </PaperProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
