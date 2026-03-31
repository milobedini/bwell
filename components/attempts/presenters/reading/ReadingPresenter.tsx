import { useCallback, useRef, useState } from 'react';
import { Linking, NativeScrollEvent, NativeSyntheticEvent, ScrollView, TextInput, View } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import { useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
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

const markdownStyle = {
  paragraph: {
    fontSize: 18,
    fontFamily: 'Lato-Regular',
    color: Colors.sway.lightGrey,
    lineHeight: 28,
    marginBottom: 12
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Lato-Black',
    color: Colors.sway.lightGrey,
    marginTop: 24,
    marginBottom: 8
  },
  h3: {
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
    fontSize: 18,
    fontFamily: 'Lato-Regular',
    color: Colors.sway.lightGrey,
    borderColor: Colors.sway.bright,
    borderWidth: 3,
    gapWidth: 12,
    backgroundColor: Colors.chip.darkCard,
    marginBottom: 12
  },
  thematicBreak: {
    color: Colors.chip.darkCardAlt,
    height: 1,
    marginTop: 16,
    marginBottom: 16
  },
  image: {
    borderRadius: 8
  },
  list: {
    fontSize: 18,
    fontFamily: 'Lato-Regular',
    color: Colors.sway.lightGrey,
    marginBottom: 12
  }
};

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
    <Container>
      {isEdit && <ReadingProgressBar progress={progress} />}

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {patientName && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 4 }}>
            {patientName}
          </ThemedText>
        )}

        <ThemedText type="title" style={{ marginBottom: 16 }}>
          {attempt.moduleSnapshot?.title ?? attempt.module?.title ?? 'Reading'}
        </ThemedText>

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

        {content ? (
          <EnrichedMarkdownText
            markdown={content}
            markdownStyle={markdownStyle}
            onLinkPress={({ url }) => Linking.openURL(url)}
          />
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
    </Container>
  );
};

export default ReadingPresenter;
