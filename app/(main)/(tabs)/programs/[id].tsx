import { View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import { ThemedText } from '@/components/ThemedText';
import { useProgram } from '@/hooks/usePrograms';

export default function ProgramDetail() {
  const { id } = useLocalSearchParams();
  const { data: program } = useProgram(id as string);

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
          </View>
        ))}
      </ScrollContentContainer>
    </ScrollContainer>
  );
}
