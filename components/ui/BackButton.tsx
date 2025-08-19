import { useCallback } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export const BackButton = () => {
  const router = useRouter();

  const onPress = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)/home');
    }
  }, [router]);

  return (
    <Pressable onPress={onPress}>
      <IconSymbol name="chevron.left" color={Colors.sway.bright} />
    </Pressable>
  );
};
