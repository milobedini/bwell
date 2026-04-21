import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type TextType =
  | 'default'
  | 'title'
  | 'subtitle'
  | 'link'
  | 'small'
  | 'smallBold'
  | 'italic'
  | 'smallTitle'
  | 'button'
  | 'error'
  | 'profileButtonText'
  | 'eyebrow'
  | 'caption'
  | 'captionBold';

export type ThemedTextProps = TextProps & {
  type?: TextType;
  className?: string;
  onLight?: boolean;
};

export function ThemedText({ style, type = 'default', onLight = false, className, ...rest }: ThemedTextProps) {
  return (
    <Text style={[styleMap[type], onLight && { color: Colors.sway.dark }, style]} {...rest} className={className} />
  );
}

const styleMap: Record<TextType, TextStyle> = StyleSheet.create({
  default: {
    fontSize: Platform.select({ ios: 18, android: 18, default: 18 }),
    lineHeight: Platform.select({ ios: 24, android: 24, default: 24 }),
    fontFamily: Fonts.Regular,
    color: Colors.sway.white
  },
  title: {
    fontSize: Platform.select({ ios: 32, android: 32, default: 36 }),
    lineHeight: Platform.select({ ios: 36, android: 36, default: 40 }),
    fontFamily: Fonts.Bold,
    marginBottom: 6,
    color: Colors.sway.white
  },
  subtitle: {
    fontSize: Platform.select({ ios: 24, android: 24, default: 28 }),
    lineHeight: Platform.select({ ios: 24, android: 24, default: 32 }),
    fontFamily: Fonts.Black,
    color: Colors.sway.white
  },
  smallTitle: {
    fontSize: Platform.select({ ios: 20, android: 20, default: 22 }),
    lineHeight: Platform.select({ ios: 20, android: 20, default: 24 }),
    fontFamily: Fonts.Black,
    color: Colors.sway.white
  },
  link: {
    fontSize: Platform.select({ ios: 13, android: 13, default: 14 }),
    lineHeight: Platform.select({ ios: 16, android: 16, default: 16 }),
    fontFamily: Fonts.Regular,
    textTransform: 'uppercase'
  },
  small: {
    fontSize: Platform.select({ ios: 14, android: 14, default: 14 }),
    lineHeight: Platform.select({ ios: 20, android: 20, default: 24 }),
    fontFamily: Fonts.Regular,
    color: Colors.sway.white
  },
  smallBold: {
    fontSize: Platform.select({ ios: 14, android: 14, default: 14 }),
    lineHeight: Platform.select({ ios: 20, android: 20, default: 24 }),
    fontFamily: Fonts.Bold,
    color: Colors.sway.white
  },
  italic: {
    fontSize: Platform.select({ ios: 18, android: 18, default: 18 }),
    lineHeight: Platform.select({ ios: 24, android: 24, default: 24 }),
    fontFamily: Fonts.Italic,
    color: Colors.sway.white
  },
  button: {
    fontSize: Platform.select({ ios: 20, android: 20, default: 22 }),
    fontFamily: Fonts.Bold,
    lineHeight: 26
  },
  error: {
    fontSize: Platform.select({ ios: 14, android: 14, default: 16 }),
    lineHeight: Platform.select({ ios: 20, android: 20, default: 24 }),
    fontFamily: Fonts.Italic,
    color: Colors.primary.error
  },
  profileButtonText: {
    fontFamily: Fonts.Bold,
    fontSize: 20,
    color: Colors.sway.white,
    marginVertical: 10
  },
  // Compact uppercase eyebrow for section headers in dense surfaces (admin dashboard, audit log).
  eyebrow: {
    fontSize: Platform.select({ ios: 12, android: 12, default: 12 }),
    lineHeight: Platform.select({ ios: 16, android: 16, default: 16 }),
    fontFamily: Fonts.Regular,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.sway.white
  },
  // Compact body text for dense list rows and secondary lines (audit rows, sub-captions).
  caption: {
    fontSize: Platform.select({ ios: 12, android: 12, default: 12 }),
    lineHeight: Platform.select({ ios: 16, android: 16, default: 18 }),
    fontFamily: Fonts.Regular,
    color: Colors.sway.white
  },
  captionBold: {
    fontSize: Platform.select({ ios: 12, android: 12, default: 12 }),
    lineHeight: Platform.select({ ios: 16, android: 16, default: 18 }),
    fontFamily: Fonts.Bold,
    color: Colors.sway.white
  }
});
