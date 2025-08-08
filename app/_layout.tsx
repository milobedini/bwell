import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import FontsContainer from '@/components/FontsContainer';
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
          </FontsContainer>
        </PaperProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
