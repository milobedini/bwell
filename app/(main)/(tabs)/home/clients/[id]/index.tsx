import { FlatList, TouchableOpacity, View } from 'react-native';
import { clsx } from 'clsx';
import { Link, useLocalSearchParams } from 'expo-router';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { DateChip } from '@/components/ui/Chip';
import { useGetPatientTimeline } from '@/hooks/useAttempts';
import { dateString } from '@/utils/dates';

const ClientDetail = () => {
  const { id } = useLocalSearchParams();

  const { data, isPending, isError } = useGetPatientTimeline({ patientId: id as string });
  // Defaults to completed attempts

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  const { attempts } = data;

  return (
    <Container>
      {attempts.length ? (
        <FlatList
          data={attempts}
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
                <TouchableOpacity key={item._id} className={clsx('gap-2 p-4', bgColor)}>
                  <ThemedText type="subtitle">{item.module.title}</ThemedText>
                  <ThemedText>
                    {item.totalScore} {item.scoreBandLabel}
                  </ThemedText>
                  <View className="flex-row items-center gap-4">
                    <DateChip prefix={'Completed'} dateString={item.completedAt || ''} />
                  </View>
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

export default ClientDetail;
