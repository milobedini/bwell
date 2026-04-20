import { useEffect, useState } from 'react';
import { AccessibilityInfo, type StyleProp, type TextStyle } from 'react-native';
import { useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ThemedText, type ThemedTextProps } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type TypewriterTextProps = Omit<ThemedTextProps, 'children'> & {
  text: string;
  enabled?: boolean;
  msPerChar?: number;
  caret?: boolean;
  caretColor?: string;
  caretStyle?: StyleProp<TextStyle>;
};

// Reveals `text` one character at a time via a Reanimated shared value.
// Reanimated cancels the animation on unmount, and reduce-motion skips to the
// final state — avoiding the fragile timing of setInterval/setTimeout.
const TypewriterText = ({
  text,
  enabled = true,
  msPerChar = 36,
  caret = true,
  caretColor = Colors.sway.bright,
  caretStyle,
  type = 'default',
  style,
  ...rest
}: TypewriterTextProps) => {
  const progress = useSharedValue(enabled ? 0 : text.length);
  const [visible, setVisible] = useState(enabled ? 0 : text.length);

  useEffect(() => {
    if (!enabled) {
      progress.value = text.length;
      setVisible(text.length);
      return;
    }

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          progress.value = text.length;
          setVisible(text.length);
          return;
        }
        progress.value = 0;
        setVisible(0);
        progress.value = withTiming(text.length, { duration: text.length * msPerChar });
      });

    return () => {
      cancelled = true;
    };
  }, [text, enabled, msPerChar, progress]);

  useAnimatedReaction(
    () => Math.floor(progress.value),
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setVisible, current);
      }
    }
  );

  const shown = text.slice(0, visible);
  const showCaret = caret && enabled && visible < text.length;

  return (
    <ThemedText type={type} style={style} {...rest}>
      {shown}
      {showCaret ? (
        <ThemedText type={type} style={[{ color: caretColor }, caretStyle]}>
          {'\u258F'}
        </ThemedText>
      ) : null}
    </ThemedText>
  );
};

export default TypewriterText;
