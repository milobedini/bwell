import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, type VideoSource, VideoView } from 'expo-video';
import { LoginLogo } from '@/components/sign-in/LoginLogo';
import { Colors } from '@/constants/Colors';
import AntDesign from '@react-native-vector-icons/ant-design';

type AuthVideoBackgroundProps = {
  videoSource: VideoSource;
  heading: string;
  onUnlock: () => void;
  children: ReactNode;
  testID?: string;
};

const AuthVideoBackground = ({ videoSource, heading, onUnlock, children, testID }: AuthVideoBackgroundProps) => {
  const { width, height } = useWindowDimensions();

  const player = useVideoPlayer(videoSource, (p) => {
    p.audioMixingMode = 'mixWithOthers';
    p.muted = true;
    p.loop = true;
    p.play();
  });

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <VideoView style={[StyleSheet.absoluteFillObject, { opacity: 1 }]} player={player} nativeControls={false} />

        <View
          style={{
            padding: 16,
            flex: 1,
            justifyContent: 'flex-end',
            paddingBottom: height * 0.2
          }}
        >
          <LoginLogo />
          <Text style={styles.heading}>{heading}</Text>
          <View
            style={{
              height: 2,
              width: width * 0.2,
              backgroundColor: Colors.primary.white,
              marginTop: 16 * 3
            }}
          />
        </View>
        <Pressable onPress={onUnlock} testID={testID}>
          <View style={styles.unlockButton}>
            <AntDesign name="unlock" size={32} color={Colors.sway.bright} />
          </View>
        </Pressable>
        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sway.dark
  },
  heading: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.sway.lightGrey
  },
  unlockButton: {
    paddingVertical: 16,
    paddingBottom: 16 * 2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sway.dark,
    borderRadius: 32
  }
});

export default AuthVideoBackground;
