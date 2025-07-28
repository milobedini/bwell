import { View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useProgram } from '@/hooks/usePrograms';

export default function ProgramDetail() {
  const { id } = useLocalSearchParams();
  const { data: program } = useProgram(id as string);
  const router = useRouter();

  const handleModulePress = (moduleId: string) => {
    // Navigate to module detail page
    router.push(`/programs/${id}/modules/${moduleId}`);
  };

  return (
    <ScrollContainer>
      <ScrollContentContainer>
        <ThemedText type="title">{program?.title}</ThemedText>
        <Divider bold />
        {program?.modules.map((module) => (
          <View key={module._id} className="mt-4">
            <ThemedText type="subtitle">{module.title}</ThemedText>
            <ThemedText>{module.description}</ThemedText>
            <ThemedText>{module.type}</ThemedText>
            <ThemedButton onPress={() => handleModulePress(module._id)}>View Module</ThemedButton>
          </View>
        ))}
      </ScrollContentContainer>
    </ScrollContainer>
  );
}
