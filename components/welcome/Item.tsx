import { ImageBackground, type ImageSourcePropType, useWindowDimensions } from 'react-native';

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
        backgroundColor: '#000'
      }}
      imageStyle={{
        flex: 1,
        resizeMode: 'cover',
        opacity: 0.7
      }}
    />
  );
};
