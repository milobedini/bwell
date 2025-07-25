import { Dimensions, ImageBackground } from 'react-native';

const { width, height } = Dimensions.get('window');

type ItemProp = {
  item: {
    image: string;
  };
};

export const Item = ({ item }: ItemProp) => (
  <ImageBackground
    source={{ uri: item.image }}
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
  ></ImageBackground>
);
