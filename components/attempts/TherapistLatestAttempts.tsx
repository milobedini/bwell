import { useCallback } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import type { TherapistLatestRow } from '@milobedini/shared-types';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';

const TherapistLatestAttempts = () => {
  const { data, isPending, isError } = useTherapistGetLatestAttempts();
  const router = useRouter();

  const handleAttemptPress = useCallback(
    (attempt: TherapistLatestRow) => {
      router.replace({
        pathname: '/(main)/attempts/therapist/[id]',
        params: {
          id: attempt._id,
          headerTitle: `${attempt.module.title} detail`
        }
      });
    },
    [router]
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data || !data.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';

          return (
            <TouchableOpacity
              key={item._id}
              className={clsx('gap-1 p-4', bgColor)}
              onPress={() => handleAttemptPress(item)}
            >
              <ThemedText>{item.module.title}</ThemedText>
              <ThemedText>
                {item.totalScore} {item.scoreBandLabel}
              </ThemedText>
            </TouchableOpacity>
          );
        }}
      ></FlatList>
    </Container>
  );
};

export default TherapistLatestAttempts;
