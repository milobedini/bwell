import { useCallback, useRef, useState } from 'react';
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useSubmitAttempt } from '@/hooks/useAttempts';
import { AttemptDetailResponseItem } from '@milobedini/shared-types';

import ReadingProgressBar from './ReadingProgressBar';

type ReadingPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const markdownStyles = StyleSheet.create({
  body: {
    color: Colors.sway.lightGrey,
    fontSize: 18,
    fontFamily: 'Lato-Regular',
    lineHeight: 28
  },
  heading2: {
    fontSize: 24,
    fontFamily: 'Lato-Black',
    color: Colors.sway.lightGrey,
    marginTop: 24,
    marginBottom: 8
  },
  heading3: {
    fontSize: 20,
    fontFamily: 'Lato-Black',
    color: Colors.sway.lightGrey,
    marginTop: 20,
    marginBottom: 6
  },
  strong: {
    fontFamily: 'Lato-Bold'
  },
  em: {
    fontFamily: 'Lato-Italic'
  },
  link: {
    color: Colors.sway.bright
  },
  blockquote: {
    backgroundColor: Colors.chip.darkCard,
    borderLeftColor: Colors.sway.bright,
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8
  },
  hr: {
    backgroundColor: Colors.chip.darkCardAlt,
    height: 1,
    marginTop: 16,
    marginBottom: 16
  },
  image: {
    borderRadius: 8
  },
  bullet_list_icon: {
    color: Colors.sway.lightGrey,
    fontSize: 8,
    marginTop: 10
  },
  ordered_list_icon: {
    color: Colors.sway.lightGrey,
    fontSize: 18,
    fontFamily: 'Lato-Regular'
  },
  list_item: {
    marginBottom: 4
  },
  paragraph: {
    marginBottom: 12
  }
});

const ReadingPresenter = ({ attempt, mode, patientName }: ReadingPresenterProps) => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const progress = useSharedValue(0);
  const [readerNote, setReaderNote] = useState(attempt.readerNote ?? '');
  const submitMutation = useSubmitAttempt(attempt._id);

  const content = attempt.moduleSnapshot?.content ?? '';

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const scrollableHeight = contentSize.height - layoutMeasurement.height;
      progress.value = scrollableHeight > 0 ? contentOffset.y / scrollableHeight : 1;
    },
    [progress]
  );

  const handleSubmit = () => {
    submitMutation.mutate({ readerNote: readerNote.trim() || undefined }, { onSuccess: () => router.back() });
  };

  const isEdit = mode === 'edit';

  return (
    <View className="flex-1 bg-sway-dark">
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickyHeaderIndices={isEdit ? [1] : undefined}
      >
        {attempt.moduleSnapshot?.disclaimer && (
          <View
            className="mb-4 rounded-lg p-3"
            style={{ backgroundColor: Colors.tint.info, borderColor: Colors.primary.info, borderWidth: 1 }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.info }}>
              {attempt.moduleSnapshot.disclaimer}
            </ThemedText>
          </View>
        )}

        {isEdit && (
          <View className="bg-sway-dark pb-3 pt-1">
            <ReadingProgressBar progress={progress} />
          </View>
        )}

        {content ? (
          <Markdown
            style={markdownStyles}
            onLinkPress={(url) => {
              Linking.openURL(url);
              return false;
            }}
          >
            {content}
          </Markdown>
        ) : (
          <ThemedText style={{ color: Colors.sway.darkGrey }}>No content available.</ThemedText>
        )}

        {isEdit && (
          <View className="mt-6">
            <ThemedText type="smallBold" style={{ marginBottom: 8 }}>
              Personal Note
            </ThemedText>
            <TextInput
              className="rounded-lg p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                color: Colors.sway.lightGrey,
                fontFamily: 'Lato-Regular',
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top'
              }}
              value={readerNote}
              onChangeText={setReaderNote}
              placeholder="Add a personal note or reflection..."
              placeholderTextColor={Colors.sway.darkGrey}
              multiline
            />
          </View>
        )}

        {!isEdit && attempt.readerNote && (
          <View className="mt-6">
            <ThemedText type="smallBold" style={{ marginBottom: 8 }}>
              {patientName ? `${patientName}'s Note` : 'Personal Note'}
            </ThemedText>
            <View className="rounded-lg p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
              <ThemedText>{attempt.readerNote}</ThemedText>
            </View>
          </View>
        )}

        {isEdit && (
          <View className="mt-6">
            <ThemedButton
              title={submitMutation.isPending ? 'Submitting...' : 'Mark as Complete'}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ReadingPresenter;
