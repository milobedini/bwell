import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, useRouter } from 'expo-router';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import 'react-native-reanimated';

import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Lato-Regular': require('../assets/fonts/Lato-Regular.ttf'),
    'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf'),
    'Lato-Black': require('../assets/fonts/Lato-Black.ttf'),
    'Lato-Light': require('../assets/fonts/Lato-Light.ttf'),
    'Lato-Italic': require('../assets/fonts/Lato-Italic.ttf'),
    'Lato-BoldItalic': require('../assets/fonts/Lato-BoldItalic.ttf'),
    'Lato-BlackItalic': require('../assets/fonts/Lato-BlackItalic.ttf'),
    'Lato-LightItalic': require('../assets/fonts/Lato-LightItalic.ttf'),
    'Lato-Thin': require('../assets/fonts/Lato-Thin.ttf'),
    'Lato-ThinItalic': require('../assets/fonts/Lato-ThinItalic.ttf')
  });

  const queryClient = new QueryClient();

  const [loggedIn, _setLoggedIn] = useState(false);

  const [layoutMounted, setLayoutMounted] = useState(false);
  const [onboarded, _setOnboarded] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      setLayoutMounted(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (layoutMounted) {
      if (loggedIn) {
        router.replace('/(main)/(tabs)/home');
      } else {
        if (onboarded) {
          router.replace('/(auth)/login');
        } else {
          router.replace('/(welcome)/ready');
        }
      }
    }
  }, [layoutMounted, loggedIn, onboarded, router]);

  if (!fontsLoaded) return <LoadingIndicator marginBottom={0} />;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <Slot />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
