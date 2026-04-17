import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type CoachMessageProps = {
  glyph: string;
  prompt: string;
  tone?: 'coach' | 'muted';
  typewriter?: boolean;
};

// A coach "moment" — NOT an iMessage bubble. Glyph + prompt, no rounded tail.
// Typewriter effect on first mount creates a sense of being addressed in real time.
const CoachMessage = ({ glyph, prompt, tone = 'coach', typewriter = true }: CoachMessageProps) => {
  const [visible, setVisible] = useState(typewriter ? 0 : prompt.length);

  useEffect(() => {
    if (!typewriter) {
      setVisible(prompt.length);
      return;
    }
    setVisible(0);
    const id = setInterval(() => {
      setVisible((n) => {
        if (n >= prompt.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 12);
    return () => clearInterval(id);
  }, [prompt, typewriter]);

  const shown = prompt.slice(0, visible);
  const color = tone === 'muted' ? Colors.sway.darkGrey : Colors.sway.lightGrey;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260 }}
      className="flex-row items-start gap-3"
    >
      <View
        className="mt-0.5 h-7 w-7 items-center justify-center rounded-full"
        style={{
          backgroundColor: Colors.tintSubtle.teal,
          borderWidth: 1,
          borderColor: Colors.tint.tealBorder
        }}
      >
        <ThemedText type="smallBold" style={{ color: Colors.sway.bright, fontSize: 13 }}>
          {glyph}
        </ThemedText>
      </View>
      <View className="flex-1">
        <ThemedText
          type="small"
          style={{ color: Colors.sway.darkGrey, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 11 }}
        >
          coach
        </ThemedText>
        <ThemedText type="default" style={{ color, marginTop: 2, lineHeight: 26 }}>
          {shown}
          {typewriter && visible < prompt.length ? (
            <ThemedText type="default" style={{ color: Colors.sway.bright }}>
              {'\u258F'}
            </ThemedText>
          ) : null}
        </ThemedText>
      </View>
    </MotiView>
  );
};

export default CoachMessage;
