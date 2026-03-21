import { type ImageSourcePropType, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';

type ItemProp = {
  item: {
    image: ImageSourcePropType;
  };
};

export const Item = ({ item }: ItemProp) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ width, height, backgroundColor: Colors.primary.black }}>
      <Image source={item.image} style={{ flex: 1, opacity: 0.7 }} contentFit="cover" />
    </View>
  );
};
