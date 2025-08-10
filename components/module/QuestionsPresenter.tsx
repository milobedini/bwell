import { View } from 'react-native';
import type { Question } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

type QuestionsPresenterProps = {
  questions: Question[];
};

const QuestionsPresenter = ({ questions }: QuestionsPresenterProps) => {
  return (
    <View>
      {questions.map((question) => (
        <View key={question._id} className="my-2">
          <ThemedText type="smallTitle" className="mb-2">
            {question.order}) {question.text}
          </ThemedText>
          <View className="mb-2 gap-2">
            {question.choices.map((choice) => (
              <ThemedText key={choice.text}>{choice.text}</ThemedText>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default QuestionsPresenter;
