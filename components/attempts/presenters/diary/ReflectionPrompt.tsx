import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type ReflectionPromptProps = {
  prompt: string;
};

const ReflectionPrompt = ({ prompt }: ReflectionPromptProps) => (
  <View
    style={{
      backgroundColor: 'rgba(24,205,186,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(24,205,186,0.12)',
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
);

export default ReflectionPrompt;
