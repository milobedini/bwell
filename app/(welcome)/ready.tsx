import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Container from '@/components/Container';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  image: {
    height: 450,
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
      <Container centered className="gap-2">
        <Image
          source={{ uri: 'https://picsum.photos/450/800' }}
          style={styles.image}
          onLoad={() => SplashScreen.hideAsync()}
        />
        <ThemedText type="title" className="text-center">
          Welcome to BWell
        </ThemedText>
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
