import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type ReflectionPromptProps = {
  prompt: string;
};

const ReflectionPrompt = ({ prompt }: ReflectionPromptProps) => (
  <View
    style={{
      backgroundColor: Colors.diary.promptBg,
      borderLeftWidth: 3,
      borderLeftColor: Colors.sway.bright,
      borderRadius: 6,
      padding: 12,
      marginBottom: 12
    }}
  >
    <ThemedText
      style={{
        color: Colors.sway.bright,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontFamily: Fonts.Bold,
        marginBottom: 2
      }}
    >
      Reflection
    </ThemedText>
    <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, lineHeight: 18 }}>{prompt}</ThemedText>
  </View>
);

export default ReflectionPrompt;
