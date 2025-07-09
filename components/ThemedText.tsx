import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts } from '@/constants/Typography';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'link' | 'small' | 'italic' | 'smallTitle' | 'button';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'smallTitle' && styles.smallTitle,
        type === 'link' && styles.link,
        type === 'small' && styles.small,
        type === 'italic' && styles.italic,
        type === 'button' && styles.button,
        style
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Platform.select({ ios: 16, android: 16, default: 18 }),
    lineHeight: Platform.select({ ios: 22, android: 22, default: 24 }),
    fontFamily: Fonts.Regular
  },
  title: {
    fontSize: Platform.select({ ios: 60, android: 60, default: 70 }),
    lineHeight: Platform.select({ ios: 62, android: 62, default: 72 }),
    fontFamily: Fonts.Bold,
    marginVertical: 8
  },
  subtitle: {
    fontSize: Platform.select({ ios: 40, android: 40, default: 50 }),
    lineHeight: Platform.select({ ios: 42, android: 42, default: 50 }),
    fontFamily: Fonts.Bold,
    marginBottom: 8
  },
  smallTitle: {
    fontSize: Platform.select({ ios: 24, android: 24, default: 30 }),
    lineHeight: Platform.select({ ios: 26, android: 26, default: 30 }),
    fontFamily: Fonts.Black,
    marginBottom: 8
  },
  link: {
    fontSize: Platform.select({ ios: 13, android: 13, default: 15 }),
    lineHeight: Platform.select({ ios: 16, android: 16, default: 18 }),
    fontFamily: Fonts.Regular,
    textTransform: 'uppercase'
  },
  small: {
    fontSize: Platform.select({ ios: 12, android: 12, default: 14 }),
    lineHeight: Platform.select({ ios: 20, android: 20, default: 24 }),
    fontFamily: Fonts.Regular
  },
  italic: {
    fontSize: Platform.select({ ios: 12, android: 12, default: 14 }),
    lineHeight: Platform.select({ ios: 20, android: 20, default: 24 }),
    fontFamily: Fonts.Italic
  },
  button: {
    fontSize: Platform.select({ ios: 18, android: 18, default: 22 }),
    fontFamily: Fonts.Bold
  }
});
