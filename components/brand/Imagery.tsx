import { Image, type ImageProps } from 'react-native';

import icon from '../../assets/images/icon.png';
import logo from '../../assets/images/logo.png';

const BWellIcon = (props: ImageProps) => {
  return (
    <Image
      source={icon}
      width={props.width || 120}
      height={props.height || 120}
      style={{
        width: props.width || 120,
        height: props.height || 120
      }}
      {...props}
    />
  );
};

const BWellLogo = (props: ImageProps) => {
  return (
    <Image
      source={logo}
      width={props.width || 260}
      height={props.height || 260}
      style={{
        width: props.width || 260,
        height: props.height || 260
      }}
      {...props}
    />
  );
};

export { BWellIcon, BWellLogo };
