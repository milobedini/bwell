import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Container from '@/components/Container';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

import logo from '../../assets/images/logo.png';

const styles = StyleSheet.create({
  image: {
    height: 500,
    width: 800,
    resizeMode: 'contain'
  },
  title: {
    color: Colors.primary.accent
  }
});

const ReadyScreen = () => {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const onGetStarted = () => {
    setStarted(true);
    router.push('/(welcome)/welcome-carousel');
  };

  if (!started) {
    return (
      <Container centered className=" bg-sway-dark gap-2">
        <Image source={logo} style={styles.image} onLoad={() => SplashScreen.hideAsync()} />
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
