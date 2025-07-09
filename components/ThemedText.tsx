import { StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts } from '@/constants/Typography';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'link' | 'small' | 'italic' | 'smallTitle';
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
        style
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.Regular
  },
  title: {
    fontSize: 70,
    lineHeight: 72,
    fontFamily: Fonts.Bold,
    marginVertical: 8
  },
  subtitle: {
    fontSize: 50,
    lineHeight: 50,
    fontFamily: Fonts.Bold,
    marginBottom: 8
  },
  smallTitle: {
    fontSize: 30,
    lineHeight: 30,
    fontFamily: Fonts.Black,
    marginBottom: 8
  },
  link: {
    lineHeight: 18,
    fontSize: 15,
    fontFamily: Fonts.Regular,
    textTransform: 'uppercase'
  },
  small: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: Fonts.Regular
  },
  italic: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: Fonts.Italic
  }
});
