import { type ReactNode, useEffect, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { interpolate, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
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

import bWellLogo from '../../assets/images/logo.png';

type HomeScreenProps = {
  content: ReactNode;
};

export const HomeScreen = ({ content }: HomeScreenProps) => {
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
    <View className="flex-1 bg-sway-dark" testID="home-screen">
      <View
        className="flex-row justify-center pb-[22]"
        style={{
          marginTop: Constants.statusBarHeight + 22
        }}
      >
        {/* Icon and search */}
        <Image source={bWellLogo} style={{ aspectRatio: 2000 / 1247, width: 140 }} />
      </View>
      {/* Content */}
      <View className="z-10 flex-[0.5]">{content}</View>
      <Canvas
        style={{
          flex: 1
        }}
      >
        <Circle c={c} r={radius}>
          <LinearGradient start={start} end={end} colors={[Colors.sway.bright, Colors.gradient.pink]} />
        </Circle>
        <BackdropFilter filter={<Blur blur={10} />} clip={rect}>
          <Circle c={c} r={radius}>
            <LinearGradient start={start} end={end} colors={[Colors.sway.bright, Colors.gradient.pink]} />
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
