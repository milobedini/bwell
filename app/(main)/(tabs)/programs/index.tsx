import { TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import { usePrograms } from '@/hooks/usePrograms';

export default function ProgramList() {
  const { data: programs, isPending, isError } = usePrograms();

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!programs || !programs.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ScrollContainer contentClassName="gap-4">
      {programs.map((program) => (
        <Link
          asChild
          key={program._id}
          push
          href={{
            pathname: '/programs/[id]',
            params: { id: program._id, headerTitle: program.title }
          }}
        >
          <TouchableOpacity>
            <View className="border border-sway-lightGrey p-4">
              <ThemedText type="smallTitle">{program.title}</ThemedText>
            </View>
            {/* <Image source={{ uri: program.imageUrl }} style={{ width: 300, height: 300 }} resizeMode="cover" /> */}
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollContainer>
  );
}
