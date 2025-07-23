import { useState } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { DetailsWrapper } from '@/components/welcome/DetailsWrapper';
import { Item } from '@/components/welcome/Item';
import { Pagination } from '@/components/welcome/Pagination';
import { welcomeConstants } from '@/components/welcome/WelcomeConstants';
import { Colors } from '@/constants/Colors';
import { markOnboardingComplete } from '@/hooks/useOnboarding';
import { AntDesign } from '@expo/vector-icons';

const AnimatedFlatList = Animated.FlatList;

const { height } = Dimensions.get('window');

const WelcomeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollY.value = ev.contentOffset.y / height;
    },
    onMomentumEnd: (ev) => {
      const index = Math.floor(ev.contentOffset.y / height);
      runOnJS(setActiveIndex)(index);
      scrollY.value = Math.floor(ev.contentOffset.y / height);
    }
  });

  const skipToRegister = async () => {
    await markOnboardingComplete();
    router.push('/(auth)/signup');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}>
      <StatusBar style="dark" />
      <AnimatedFlatList
        data={welcomeConstants.data}
        renderItem={(props) => <Item {...props} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        pagingEnabled
        decelerationRate={'fast'}
        bounces={false}
      />
      <Pagination scrollY={scrollY} data={welcomeConstants.data} />
      <DetailsWrapper scrollY={scrollY} data={welcomeConstants.data} />
      <TouchableOpacity
        style={{
          position: 'absolute',
          ...(activeIndex === welcomeConstants.data.length - 1
            ? {
                bottom: welcomeConstants.spacing * 3,
                alignSelf: 'center'
              }
            : {
                top: welcomeConstants.spacing * 5,
                right: welcomeConstants.spacing
              })
        }}
      >
        <TouchableOpacity
          onPress={skipToRegister}
          style={{
            width: welcomeConstants.buttonSize * 3,
            height: welcomeConstants.buttonSize,
            borderRadius: welcomeConstants.buttonSize / 2,
            backgroundColor: Colors.sway.bright,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row'
          }}
        >
          <ThemedText type="link" className="text-sway-dark">
            Create Account
          </ThemedText>
          <AntDesign
            name="arrowright"
            size={welcomeConstants.buttonSize / 2}
            color={Colors.sway.dark}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeCarousel;
