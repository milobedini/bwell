import { TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

const FIRST_ATTEMPT_PROMPTS = [
  'Are these goals in line with your values and what is important to you?',
  'Are your goals achievable or do you need to add some steps to get to the final outcome?',
  'Are these goals relevant to improving your mood?'
];

const RE_RATING_PROMPT = 'How do you feel about your progress towards these goals?';

type ReflectionSectionProps = {
  reflection: string;
  isReRating: boolean;
  canEdit: boolean;
  onReflectionChange?: (text: string) => void;
};

const ReflectionSection = ({ reflection, isReRating, canEdit, onReflectionChange }: ReflectionSectionProps) => {
  const prompts = isReRating ? [RE_RATING_PROMPT] : FIRST_ATTEMPT_PROMPTS;

  return (
    <View className="mt-2">
      <View className="mb-3 flex-row items-center gap-2">
        <MaterialCommunityIcons name="thought-bubble-outline" size={20} color={Colors.primary.info} />
        <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey }}>
          Reflection
        </ThemedText>
      </View>

      {/* Prompt card */}
      {canEdit && (
        <View
          className="mb-3 rounded-xl p-4"
          style={{
            backgroundColor: Colors.diary.promptBg,
            borderWidth: 1,
            borderColor: 'rgba(24,205,186,0.12)'
          }}
        >
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 6 }}>
            {isReRating ? 'Consider:' : 'Consider these questions:'}
          </ThemedText>
          {prompts.map((prompt, i) => (
            <View key={i} className="mb-1.5 flex-row">
              <ThemedText type="small" style={{ color: Colors.sway.bright, marginRight: 8, marginTop: 1 }}>
                {'\u2022'}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.bright, flex: 1 }}>
                {prompt}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Reflection input or display */}
      {canEdit ? (
        <TextInput
          value={reflection}
          onChangeText={onReflectionChange}
          placeholder="Write your reflection..."
          placeholderTextColor={Colors.sway.darkGrey}
          multiline
          blurOnSubmit
          returnKeyType="done"
          textAlignVertical="top"
          style={{
            backgroundColor: Colors.chip.darkCardDeep,
            color: Colors.sway.lightGrey,
            borderRadius: 12,
            padding: 14,
            minHeight: 120,
            fontSize: 16,
            fontFamily: 'Lato-Regular'
          }}
        />
      ) : reflection ? (
        <View
          className="rounded-xl p-4"
          style={{
            backgroundColor: Colors.chip.darkCard,
            borderLeftWidth: 3,
            borderLeftColor: Colors.primary.info
          }}
        >
          <ThemedText>{reflection}</ThemedText>
        </View>
      ) : null}
    </View>
  );
};

export default ReflectionSection;
