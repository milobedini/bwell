import { Image, type ImageProps } from 'expo-image';

import icon from '../../assets/images/icon.png';
import logo from '../../assets/images/logo.png';

const BWellIcon = (props: ImageProps) => {
  return (
    <Image
      source={icon}
      style={{
        width: 120,
        height: 120
      }}
      {...props}
    />
  );
};

const BWellLogo = (props: ImageProps) => {
  return (
    <Image
      source={logo}
      style={{
        width: 260,
        height: 260
      }}
      {...props}
    />
  );
};

export { BWellIcon, BWellLogo };
