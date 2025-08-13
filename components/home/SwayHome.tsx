import { useEffect, useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { interpolate, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import { AntDesign } from '@expo/vector-icons';
import {
  BackdropFilter,
  Blur,
  Canvas,
  Circle,
  DisplacementMap,
  Fill,
  LinearGradient,
  Offset,
  Turbulence,
  vec
} from '@shopify/react-native-skia';

import { ThemedText } from '../ThemedText';

import swayText from '../../assets/images/icon.png';
// import { textStyles } from '../../../../components/text';
// import { useAppSelector } from '../../../../lib/redux/hooks';
// import { ThenThrow } from '../../../../lib/then-throw';
// import { meditationGallery } from '../../../meditate/screens/meditation-menu/gallery/MeditationGallery';
// import { HomeNavigatorParamsList } from '../../HomeNavigatorParamsList';
// import meditationImage from './logo_black.png';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sway.dark
  },
  topContainer: {
    flexDirection: 'row',
    marginTop: Constants.statusBarHeight + 22,
    justifyContent: 'center',
    paddingBottom: 22
  },
  buttonContainer: {
    flex: 0.5
    // paddingTop: 80,
  },
  button: {
    flexDirection: 'row',
    width: 300,
    alignSelf: 'center',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(43, 59, 91, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sway.bright
  },
  image: {
    width: 120,
    height: 120
  },
  imageTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: Colors.sway.lightGrey,
    maxWidth: '50%'
  }
});

export const HomeScreen = () => {
  const progress = useSharedValue(0);
  const { width, height } = useWindowDimensions();
  const c = vec(width / 2, height / 4);
  const r = c.x - 32;
  // below defines half of the screen
  const rect = useMemo(() => ({ x: 0, y: c.y, width, height: c.y }), [c.y, width]);
  const radius = useDerivedValue(() => interpolate(progress.value, [0, 1], [r, r / 2]), [r]);
  const start = useDerivedValue(() => vec(c.x, c.y - radius.value), [c]);
  const end = useDerivedValue(() => vec(c.x, c.y + radius.value), [c]);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Image source={swayText} style={{ aspectRatio: 2000 / 1247, width: 80 }} />
      </View>
      <AntDesign
        name="search1"
        size={40}
        color={Colors.sway.darkGrey}
        style={{
          position: 'absolute',
          top: Constants.statusBarHeight + 26,
          right: 22
        }}
        onPress={() => {}}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => {}} style={[styles.button]} activeOpacity={0.4}>
          <ThemedText type="title" style={styles.imageTitle}>
            Your Daily Meditation
          </ThemedText>
          <Image source={swayText} style={styles.image} />
        </TouchableOpacity>
      </View>
      <Canvas
        style={{
          flex: 1
        }}
      >
        <Circle c={c} r={radius}>
          <LinearGradient start={start} end={end} colors={[Colors.sway.bright, '#E70696']} />
        </Circle>
        <BackdropFilter filter={<Blur blur={10} />} clip={rect}>
          <Circle c={c} r={radius}>
            <LinearGradient start={start} end={end} colors={[Colors.sway.bright, '#E70696']} />
          </Circle>
          <Blur blur={1}>
            <Offset x={0} y={0}>
              <DisplacementMap channelX="a" channelY="r" scale={50}>
                <Turbulence freqX={0.01} freqY={0.05} octaves={4} />
              </DisplacementMap>
            </Offset>
          </Blur>
          <Fill color="rgba(0, 0, 0, 0.3)" />
        </BackdropFilter>
      </Canvas>
    </View>
  );
};
