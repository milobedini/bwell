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
  variant?: 'default' | 'error';
  centered?: boolean;
};

const ThemedButton = (props: ThemedButtonProps) => {
  const { className, children, disabled, compact, title, variant = 'default', centered, ...rest } = props;
  return (
    <TouchableOpacity
      disabled={disabled}
      className={clsx(
        'rounded-md p-4',
        disabled && 'bg-sway-darkGrey',
        compact && `w-[200] px-3 py-2`,
        variant === 'error' && 'bg-error',
        variant === 'default' && 'bg-sway-bright',
        centered && 'self-center',
        className
      )}
      {...rest}
    >
      <ThemedText type="button" className="text-center">
        {title ? title : children}
      </ThemedText>
    </TouchableOpacity>
  );
};

const PrimaryButton = ({ onPress, title, logo, className, textClasses, logoClasses, variant }: ThemedButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={clsx(
        'w-[300] flex-row items-center justify-evenly self-center rounded-lg border',
        !variant && 'border-sway-bright bg-sway-buttonBackground',
        variant === 'error' && 'bg-error text-black',
        className
      )}
      activeOpacity={0.4}
    >
      <ThemedText
        type="title"
        className={clsx('max-w-[50%] text-center', textClasses)}
        style={{ fontSize: 20 }}
        onLight={variant === 'error'}
      >
        {title}
      </ThemedText>
      {logo && <Image source={bWellIcon} className={clsx('h-[120] w-[120]', logoClasses)} />}
    </TouchableOpacity>
  );
};

const SecondaryButton = ({ onPress, title, children }: ThemedButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="my-2.5 w-full rounded-xl bg-sway-buttonBackground p-3"
    >
      <ThemedText type="profileButtonText">{title || children}</ThemedText>
    </TouchableOpacity>
  );
};

export default ThemedButton;
export { PrimaryButton, SecondaryButton };
