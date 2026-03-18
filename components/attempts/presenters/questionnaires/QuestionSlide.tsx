import { useMemo } from 'react';
import { View } from 'react-native';
import { Card } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { SelectableChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailItem } from '@milobedini/shared-types';

type QuestionSlideProps = {
  mode: 'view' | 'edit';
  question: AttemptDetailItem;
  onPick?(q: AttemptDetailItem, choice: { score: number; index: number; text: string }): void;
  colors?: {
    card: string;
    accent: string;
    muted: string;
    textOnDark: string;
  };
};

const QuestionSlide = ({ mode, question, onPick, colors }: QuestionSlideProps) => {
  const disabled = mode === 'view';

  const { questionText, choices, chosenIndex } = question;

  const selected = typeof chosenIndex === 'number' ? chosenIndex : null;

  const pills = useMemo(
    () =>
      choices.map((c, idx) => {
        const selectedPill = selected === idx;
        return (
          <SelectableChip
            key={`${question.questionId}-${idx}`}
            label={c.text}
            selected={selectedPill}
            disabled={disabled}
            onPress={() => onPick?.(question, { score: c.score, index: idx, text: c.text })}
            selectedBg={colors?.accent}
            unselectedBg={colors?.card}
            selectedTextColor={Colors.chip.darkCardDeep}
            unselectedTextColor={colors?.textOnDark}
            className="mb-2 mr-2 self-start"
          />
        );
      }),
    [choices, colors?.accent, colors?.card, colors?.textOnDark, disabled, onPick, question, selected]
  );

  return (
    <Card
      style={{
        marginHorizontal: 16,
        backgroundColor: colors?.card,
        height: '100%'
      }}
    >
      <Card.Content style={{ height: '100%', width: '100%', justifyContent: 'space-around' }}>
        <ThemedText type="smallTitle" className="mb-2">
          {questionText}
        </ThemedText>
        <View className="flex-row flex-wrap">{pills}</View>
      </Card.Content>
    </Card>
  );
};

export default QuestionSlide;
