import { FlatList, View } from 'react-native';
import { clsx } from 'clsx';
import { useTherapistGetLatestAttempts } from '@/hooks/useAttempts';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';

const TherapistLatestAttempts = () => {
  const { data, isPending, isError } = useTherapistGetLatestAttempts();

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
            <View key={item._id} className={clsx('gap-1 p-4', bgColor)}>
              <ThemedText>{item.module.title}</ThemedText>
              <ThemedText>
                {item.totalScore} {item.scoreBandLabel}
              </ThemedText>
            </View>
          );
        }}
      ></FlatList>
    </Container>
  );
};

export default TherapistLatestAttempts;
