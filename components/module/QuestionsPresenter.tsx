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
          <ThemedText type="smallTitle">
            {question.order}) {question.text}
          </ThemedText>
          <View>
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
