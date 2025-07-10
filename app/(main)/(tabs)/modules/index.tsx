import { Button, Image, View } from 'react-native';
import { router } from 'expo-router';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import { useModules } from '@/hooks/useModules';

export default function ModuleList() {
  const { data: modules } = useModules();

  return (
    <ScrollContainer centered contentClassName="gap-4">
      <ThemedText type="subtitle">Modules List</ThemedText>
      {modules?.map((module) => (
        <View key={module._id}>
          <ThemedText type="smallTitle">{module.title}</ThemedText>
          <ThemedText type="italic">{module.description}</ThemedText>
          <Image source={{ uri: module.imageUrl }} style={{ width: 300, height: 300 }} resizeMode="cover" />
        </View>
      ))}
      <Button title="Open Module 1" onPress={() => router.push('/(main)/(tabs)/modules/1')} />
    </ScrollContainer>
  );
}
