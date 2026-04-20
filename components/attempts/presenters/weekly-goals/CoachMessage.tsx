import { View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import TypewriterText from '@/components/ui/TypewriterText';
import { Colors } from '@/constants/Colors';

type CoachMessageProps = {
  glyph: string;
  prompt: string;
  tone?: 'coach' | 'muted';
  typewriter?: boolean;
};

const CoachMessage = ({ glyph, prompt, tone = 'coach', typewriter = true }: CoachMessageProps) => {
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
        <TypewriterText
          text={prompt}
          enabled={typewriter}
          type="default"
          style={{ color, marginTop: 2, lineHeight: 26 }}
        />
      </View>
    </MotiView>
  );
};

export default CoachMessage;
