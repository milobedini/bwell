import { FlatList, TouchableOpacity } from 'react-native';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
import { useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import { dateString } from '@/utils/dates';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';

const TherapistLatestAttempts = () => {
  const { data, isPending, isError } = useTherapistGetLatestAttempts();

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      {data.length ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => {
            const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';

            return (
              <Link
                asChild
                href={{
                  pathname: '/attempts/[id]',
                  params: {
                    id: item._id,
                    headerTitle: `${item.module.title} (${dateString(item.completedAt || '')})`
                  }
                }}
                push
                withAnchor
              >
                <TouchableOpacity key={item._id} className={clsx('gap-1 p-4', bgColor)}>
                  <ThemedText>
                    {item.module.title} by {item.user.name}
                  </ThemedText>
                  <ThemedText>
                    {item.totalScore} {item.scoreBandLabel}
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            );
          }}
        ></FlatList>
      ) : (
        <ThemedText className="p-4">No submissions...</ThemedText>
      )}
    </Container>
  );
};

export default TherapistLatestAttempts;
