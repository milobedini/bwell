import { TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { WeeklyGoalsReflection } from '@milobedini/shared-types';

import CoachMessage from './CoachMessage';
import { REFLECTION_PROMPTS, type ReflectionKey } from './useWeeklyGoalsState';

type ReflectionThreadProps = {
  reflection: WeeklyGoalsReflection;
  canEdit: boolean;
  onChange: (key: ReflectionKey, value: string) => void;
};

// The four-beat end-of-week conversation. Each prompt is revealed progressively:
// the next beat softly fades in once the previous one is non-empty, so the user
// is never staring at four blank inputs at once.
const ReflectionThread = ({ reflection, canEdit, onChange }: ReflectionThreadProps) => {
  const steps = REFLECTION_PROMPTS.map((p, i) => ({
    ...p,
    value: reflection[p.key] ?? '',
    index: i
  }));

  // In edit mode: show prompts up to (and including) the next unanswered one.
  // In view mode: show every prompt that has an answer.
  const visibleCount = canEdit
    ? Math.min(steps.length, Math.max(1, steps.findIndex((s) => s.value.trim().length === 0) + 1) || steps.length)
    : steps.filter((s) => s.value.trim().length > 0).length;

  const visibleSteps = canEdit ? steps.slice(0, visibleCount) : steps.filter((s) => s.value.trim().length > 0);

  if (!canEdit && visibleSteps.length === 0) return null;

  return (
    <View className="mt-6">
      {/* Section divider */}
      <View className="mb-5 flex-row items-center gap-3">
        <View className="h-px flex-1" style={{ backgroundColor: Colors.divider.medium }} />
        <ThemedText
          type="smallBold"
          style={{
            color: Colors.sway.darkGrey,
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontSize: 10
          }}
        >
          End of week · Reflection
        </ThemedText>
        <View className="h-px flex-1" style={{ backgroundColor: Colors.divider.medium }} />
      </View>

      {visibleSteps.map((step, i) => {
        const isLast = i === visibleSteps.length - 1;
        return (
          <MotiView
            key={step.key}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 320, delay: i * 80 }}
            className="mb-6"
          >
            <CoachMessage glyph={step.glyph} prompt={step.prompt} typewriter={canEdit && isLast} />

            {/* Connector */}
            <View className="mb-2 ml-3.5 mt-2 w-px" style={{ height: 14, backgroundColor: Colors.divider.light }} />

            {canEdit ? (
              <TextInput
                value={step.value}
                onChangeText={(t) => onChange(step.key, t)}
                placeholder="A sentence is plenty."
                placeholderTextColor={Colors.sway.darkGrey}
                multiline
                blurOnSubmit
                returnKeyType="done"
                textAlignVertical="top"
                style={{
                  backgroundColor: 'transparent',
                  color: Colors.sway.lightGrey,
                  borderWidth: 0,
                  borderLeftWidth: 2,
                  borderLeftColor: step.value.trim().length > 0 ? Colors.sway.bright : Colors.divider.medium,
                  paddingVertical: 8,
                  paddingLeft: 12,
                  paddingRight: 6,
                  minHeight: 64,
                  fontSize: 17,
                  fontFamily: 'Lato-Italic',
                  lineHeight: 26
                }}
                accessibilityLabel={step.prompt}
              />
            ) : (
              <View className="py-2 pl-3" style={{ borderLeftWidth: 2, borderLeftColor: Colors.sway.bright }}>
                <ThemedText type="italic" style={{ color: Colors.sway.lightGrey, lineHeight: 26 }}>
                  {step.value}
                </ThemedText>
              </View>
            )}
          </MotiView>
        );
      })}
    </View>
  );
};

export default ReflectionThread;
