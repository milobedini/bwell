import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type ReflectionPromptProps = {
  prompt: string;
};

const ReflectionPrompt = memo(({ prompt }: ReflectionPromptProps) => (
  <View
    style={{
      backgroundColor: Colors.tintSubtle.teal,
      borderWidth: 1,
      borderColor: Colors.tintSubtle.tealBorder,
      borderRadius: 8,
      padding: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start'
    }}
  >
    <MaterialCommunityIcons name="lightbulb-outline" size={16} color={Colors.sway.bright} style={{ marginTop: 1 }} />
    <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 12, lineHeight: 18, fontStyle: 'italic', flex: 1 }}>
      {prompt}
    </ThemedText>
  </View>
));

ReflectionPrompt.displayName = 'ReflectionPrompt';

export default ReflectionPrompt;
