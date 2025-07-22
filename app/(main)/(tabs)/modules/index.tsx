import { useCallback } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import { useModules } from '@/hooks/useModules';

export default function ModuleList() {
  const { data: modules, isPending } = useModules();
  const router = useRouter();

  const handleModulePress = useCallback(
    (moduleId: string) => {
      router.push(`/modules/${moduleId}`);
    },
    [router]
  );

  if (!modules || !modules.length) {
    return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;
  }

  return (
    <ScrollContainer centered contentClassName="gap-4">
      <ThemedText type="subtitle">Modules List</ThemedText>
      {isPending && <LoadingIndicator marginBottom={0} />}
      {modules?.map((module) => (
        <TouchableOpacity key={module._id} onPress={() => handleModulePress(module._id)}>
          <ThemedText type="smallTitle">{module.title}</ThemedText>
          <ThemedText type="italic">{module.description}</ThemedText>
          <Image source={{ uri: module.imageUrl }} style={{ width: 300, height: 300 }} resizeMode="cover" />
        </TouchableOpacity>
      ))}
    </ScrollContainer>
  );
}
