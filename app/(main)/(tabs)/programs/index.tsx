import { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import { usePrograms } from '@/hooks/usePrograms';
import type { Program } from '@milobedini/shared-types';

export default function ProgramList() {
  const { data: programs, isPending, isError } = usePrograms();
  const router = useRouter();

  const handleProgramPress = useCallback(
    (program: Program) => {
      router.push({
        pathname: '/programs/[id]',
        params: { id: program._id, headerTitle: program.title }
      });
    },
    [router]
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!programs || !programs.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ScrollContainer contentClassName="gap-4">
      <ThemedText type="subtitle">Programs List</ThemedText>
      {programs.map((program) => (
        <TouchableOpacity key={program._id} onPress={() => handleProgramPress(program)}>
          <View className="border border-sway-lightGrey p-4">
            <ThemedText type="smallTitle">{program.title}</ThemedText>
          </View>
          {/* <Image source={{ uri: program.imageUrl }} style={{ width: 300, height: 300 }} resizeMode="cover" /> */}
        </TouchableOpacity>
      ))}
    </ScrollContainer>
  );
}
