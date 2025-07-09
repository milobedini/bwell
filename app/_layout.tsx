import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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

  const [loggedIn, _setLoggedIn] = useState(false);

  const [layoutMounted, setLayoutMounted] = useState(false);

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
        router.replace('/(auth)/login');
      }
    }
  }, [layoutMounted]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}
