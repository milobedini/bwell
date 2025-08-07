import { Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useNavigation } from '@react-navigation/native';

export const BackButton = () => {
  const navigation = useNavigation();

  if (!navigation.canGoBack()) return null;

  return (
    <Pressable onPress={() => navigation.goBack()}>
      <IconSymbol name="chevron.left" color={Colors.sway.bright} />
    </Pressable>
  );
};
