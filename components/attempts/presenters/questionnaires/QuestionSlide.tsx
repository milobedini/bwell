import { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Fonts } from '@/constants/Typography';
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
          <Chip
            key={`${question.questionId}-${idx}`}
            mode={selectedPill ? 'flat' : 'outlined'}
            selected={!!selectedPill}
            disabled={disabled}
            showSelectedCheck={false}
            compact
            style={{
              backgroundColor: selectedPill ? colors?.accent : colors?.card,
              borderColor: selectedPill ? colors?.accent : '#334368',
              marginRight: 8,
              marginBottom: 8
            }}
            textStyle={{
              color: selectedPill ? '#0B1A2A' : colors?.textOnDark,
              fontFamily: selectedPill ? Fonts.Bold : Fonts.Regular,
              fontSize: 14
            }}
            onPress={() => {
              if (disabled) return;
              onPick?.(question, { score: c.score, index: idx, text: c.text });
            }}
          >
            {c.text}
          </Chip>
        );
      }),
    [choices, colors?.accent, colors?.card, colors?.textOnDark, disabled, onPick, question, selected]
  );

  return (
    <Card
      style={{
        width: '100%',
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
