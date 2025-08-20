import { FlatList, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { clsx } from 'clsx';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { useAllUsers } from '@/hooks/useUsers';

const AllUsersList = () => {
  const { data, isPending, isError } = useAllUsers({
    page: 1,
    limit: 20,
    // q: 'Milo',
    roles: ['therapist'],
    isVerified: true,
    // hasTherapist: true,
    sort: 'name:asc',
    select: ['_id', 'name', 'email', 'username']
  });

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data && !isPending) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  return (
    <Container>
      <ThemedText type="title" className="text-center">
        All Users
      </ThemedText>

      <FlatList
        data={data.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';

          return (
            <View key={item._id} className={clsx('gap-1 p-4', bgColor)}>
              <ThemedText type="smallTitle">{item.name}</ThemedText>
              <ThemedText>{item.email}</ThemedText>
              <ThemedText>{item.username}</ThemedText>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <Divider bold className="mt-2" />}
      ></FlatList>
      <View className="p-4">
        <ThemedText>{data.total} items</ThemedText>
        <ThemedText>
          Page {data.page} of {data.totalPages}
        </ThemedText>
        <ThemedText>{data.limit} per page</ThemedText>
      </View>
    </Container>
  );
};

export default AllUsersList;
