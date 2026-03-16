import { ImageBackground, type ImageSourcePropType, useWindowDimensions } from 'react-native';
import { Colors } from '@/constants/Colors';

type ItemProp = {
  item: {
    image: ImageSourcePropType;
  };
};

export const Item = ({ item }: ItemProp) => {
  const { width, height } = useWindowDimensions();

  return (
    <ImageBackground
      source={item.image}
      style={{
        width,
        height,
        backgroundColor: Colors.primary.black
      }}
      imageStyle={{
        flex: 1,
        resizeMode: 'cover',
        opacity: 0.7
      }}
    />
  );
};
