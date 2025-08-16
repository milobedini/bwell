import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AccessPolicy } from '@/types/types';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const EnrolledChip = () => {
  return (
    <Chip
      icon={() => <MaterialCommunityIcons name="bookmark-check" size={24} color={Colors.primary.charcoal} />}
      mode="outlined"
      compact
      textStyle={{
        fontFamily: Fonts.Black,
        color: Colors.primary.charcoal
      }}
      style={{
        backgroundColor: Colors.primary.accent,
        borderColor: Colors.primary.rose
      }}
    >
      Enrolled
    </Chip>
  );
};

const PendingChip = ({ animate }: { animate?: boolean }) => {
  const topOpacity = useRef(new Animated.Value(1)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    const loop = Animated.loop(
      Animated.sequence([
        // fade to bottom (sand collects)
        Animated.parallel([
          Animated.timing(topOpacity, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(bottomOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ]),
        Animated.delay(800),
        // flip back to top
        Animated.parallel([
          Animated.timing(topOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(bottomOpacity, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ]),
        Animated.delay(800)
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [bottomOpacity, topOpacity, animate]);

  const animatedIcon = (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', opacity: topOpacity }}>
        <MaterialIcons name="hourglass-top" size={24} color={Colors.primary.info} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: bottomOpacity }}>
        <MaterialIcons name="hourglass-bottom" size={24} color={Colors.primary.info} />
      </Animated.View>
    </View>
  );

  return (
    <Chip
      icon={() => {
        if (animate) return animatedIcon;
        return <MaterialIcons name="hourglass-top" size={24} color={Colors.primary.info} />;
      }}
      textStyle={{
        fontFamily: Fonts.Black,
        color: Colors.primary.info
      }}
      style={{
        backgroundColor: Colors.sway.buttonBackground,
        borderColor: Colors.sway.bright
      }}
    >
      Awaiting BWell verification
    </Chip>
  );
};

type AccessPolicyChipProps = {
  accessPolicy: AccessPolicy;
};

const AccessPolicyChip = ({ accessPolicy }: AccessPolicyChipProps) => {
  switch (accessPolicy) {
    case AccessPolicy.ASSIGNED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.sway.lightGrey} />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.sway.lightGrey
          }}
          style={{
            backgroundColor: Colors.primary.charcoal,
            borderColor: Colors.sway.darkGrey
          }}
        >
          Assignment only
        </Chip>
      );

    case AccessPolicy.ENROLLED:
      return (
        <Chip
          icon={() => <MaterialCommunityIcons name="account-star" size={24} color={Colors.sway.lightGrey} />}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.sway.lightGrey
          }}
          style={{
            backgroundColor: Colors.primary.charcoal,
            borderColor: Colors.sway.darkGrey
          }}
        >
          Enrolled only
        </Chip>
      );
    case AccessPolicy.OPEN:
      return (
        <Chip
          icon={() => (
            <MaterialCommunityIcons name="lock-open-variant-outline" size={24} color={Colors.sway.lightGrey} />
          )}
          mode="outlined"
          compact
          textStyle={{
            fontFamily: Fonts.Black,
            color: Colors.sway.lightGrey
          }}
          style={{
            backgroundColor: Colors.primary.charcoal,
            borderColor: Colors.sway.darkGrey
          }}
        >
          Open
        </Chip>
      );

    default:
      return null;
  }
};

export { AccessPolicyChip, EnrolledChip, PendingChip };
