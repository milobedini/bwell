import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AntDesign } from '@expo/vector-icons';

import { welcomeConstants } from './WelcomeConstants';

type DetailsProps = {
  scrollY: { value: number };
  item: { title: string; description: string };
  index: number;
};
export const Details = ({ scrollY, item, index }: DetailsProps) => {
  const stylez = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(scrollY.value, [index - 1, index, index + 1], [20, 0, -20], Extrapolation.CLAMP)
        }
      ]
    };
  });
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: '100%',
          zIndex: welcomeConstants.data.length - index,
          overflow: 'hidden'
        }
      ]}
    >
      <Animated.View style={stylez}>
        <Text
          style={{
            color: Colors.sway.bright,
            fontFamily: Fonts.BoldItalic,
            fontSize: 40,
            marginBottom: welcomeConstants.spacing / 2,
            textTransform: 'capitalize'
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: '#fff',
            fontFamily: Fonts.Regular,
            fontSize: 16,
            marginBottom: welcomeConstants.spacing / 2
          }}
        >
          {item.description}
        </Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 18,
            fontFamily: Fonts.Bold,
            textTransform: 'uppercase'
          }}
        >
          {index !== 2 ? (
            <AntDesign name="arrowdown" size={welcomeConstants.buttonSize} color={Colors.primary.accent} />
          ) : null}
        </Text>
      </Animated.View>
    </View>
  );
};
