import { Image, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { clsx } from 'clsx';

import { ThemedText } from './ThemedText';

import bWellIcon from '../assets/images/icon.png';

type ThemedButtonProps = TouchableOpacityProps & {
  compact?: boolean;
  title?: string;
  logo?: boolean;
  textClasses?: string;
  logoClasses?: string;
};

const ThemedButton = (props: ThemedButtonProps) => {
  const { className, children, disabled, compact, ...rest } = props;
  return (
    <TouchableOpacity
      disabled={disabled}
      className={clsx(
        'rounded-md bg-sway-bright p-4',
        disabled && 'bg-sway-darkGrey',
        compact && 'self-start p-3',
        className
      )}
      {...rest}
    >
      <ThemedText type="button" className="text-center">
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
};

const PrimaryButton = ({ onPress, title, logo, className, textClasses, logoClasses }: ThemedButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={clsx(
        'mt-5  w-[300] flex-row items-center justify-evenly self-center rounded-lg border border-sway-bright bg-sway-buttonBackground',
        className
      )}
      activeOpacity={0.4}
    >
      <ThemedText
        type="title"
        className={clsx('max-w-[50%] text-center text-sway-lightGrey', textClasses)}
        style={{ fontSize: 20 }}
      >
        {title}
      </ThemedText>
      {logo && <Image source={bWellIcon} className={clsx('h-[120] w-[120]', logoClasses)} />}
    </TouchableOpacity>
  );
};

export default ThemedButton;
export { PrimaryButton };
