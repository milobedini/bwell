import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Container from '@/components/Container';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';

import logo from '../../assets/images/logo.png';

const ReadyScreen = () => {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const { width } = useWindowDimensions();
  const imageSize = Math.min(width * 0.6, 280);

  const onGetStarted = () => {
    setStarted(true);
    router.push('/(welcome)/welcome-carousel');
  };

  if (!started) {
    return (
      <Container centered className="justify-evenly bg-sway-dark px-4">
        <Image
          source={logo}
          style={{ width: imageSize, height: imageSize }}
          contentFit="contain"
          onLoad={() => SplashScreen.hideAsync()}
        />
        <ThemedText type="title">Welcome to BWell</ThemedText>
        <ThemedButton onPress={onGetStarted}>Get started!</ThemedButton>
      </Container>
    );
  }
  return (
    <Container>
      <StatusBar style="auto" hidden />
    </Container>
  );
};

export default ReadyScreen;
