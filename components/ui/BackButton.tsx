import { useCallback } from 'react';
import { Pressable } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export const BackButton = ({ backTo }: { backTo?: Href }) => {
  const router = useRouter();

  const onPress = useCallback(() => {
    if (backTo) {
      router.replace(backTo);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)/home');
    }
  }, [backTo, router]);

  return (
    <Pressable onPress={onPress}>
      <IconSymbol name="chevron.left" color={Colors.sway.bright} />
    </Pressable>
  );
};
