import { Image, View } from 'react-native';
import { Colors } from '@/constants/Colors';

import imageSource from '../../assets/images/icon.png';

export const LoginLogo = () => (
  <View
    style={{
      backgroundColor: Colors.sway.dark,
      borderRadius: 80,
      width: 100,
      height: 100,
      borderWidth: 1,
      borderColor: Colors.sway.white,
      marginBottom: 16 * 3
    }}
  >
    <Image
      source={imageSource}
      style={{
        width: 100,
        height: 100,
        resizeMode: 'cover'
      }}
    />
  </View>
);
