import type { ReactNode } from 'react';
import { Pressable, PressableProps } from 'react-native';
import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';

import { ThemedText } from './ThemedText';

import bWellIcon from '../assets/images/icon.png';

type ThemedButtonProps = PressableProps & {
  compact?: boolean;
  title?: string;
  logo?: boolean;
  textClasses?: string;
  logoClasses?: string;
  variant?: 'default' | 'error' | 'outline';
  centered?: boolean;
  children?: ReactNode;
};

const ThemedButton = (props: ThemedButtonProps) => {
  const { className, children, disabled, compact, title, variant = 'default', centered, textClasses, ...rest } = props;
  return (
    <Pressable
      disabled={disabled}
      className={clsx(
        'group rounded-md p-4 hover:opacity-80',
        disabled && 'bg-sway-darkGrey',
        compact && 'w-[200] px-3 py-2',
        variant === 'error' && 'bg-error',
        variant === 'outline' && 'bg-transparent border-[1.5px] border-sway-bright',
        variant === 'default' && !disabled && 'bg-sway-bright',
        centered && 'self-center',
        className
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      <ThemedText
        type="button"
        className={clsx('text-center group-active:opacity-70', textClasses)}
        style={variant === 'outline' ? { color: Colors.sway.bright } : undefined}
      >
        {title ?? children}
      </ThemedText>
    </Pressable>
  );
};

const PrimaryButton = ({ onPress, title, logo, className, textClasses, logoClasses, variant }: ThemedButtonProps) => (
  <Pressable
    onPress={onPress}
    className={clsx(
      'group w-[300] flex-row items-center justify-evenly self-center rounded-lg border',
      !variant && 'border-sway-bright bg-sway-buttonBackground hover:border-sway-lightGrey',
      variant === 'error' && 'bg-error text-black',
      className
    )}
    accessibilityRole="button"
  >
    <ThemedText
      type="title"
      className={clsx('max-w-[50%] text-center group-active:opacity-40', textClasses)}
      style={{ fontSize: 20 }}
      onLight={variant === 'error'}
    >
      {title}
    </ThemedText>
    {logo && <Image source={bWellIcon} className={clsx('h-[120] w-[120]', logoClasses)} />}
  </Pressable>
);

const SecondaryButton = ({ onPress, title, children }: ThemedButtonProps) => (
  <Pressable
    onPress={onPress}
    className="group my-2.5 w-full rounded-xl bg-sway-buttonBackground p-3 hover:bg-sway-buttonBackgroundSolid"
    accessibilityRole="button"
  >
    <ThemedText type="profileButtonText" className="group-active:opacity-70">
      {title ?? children}
    </ThemedText>
  </Pressable>
);

export default ThemedButton;
export { PrimaryButton, SecondaryButton };
