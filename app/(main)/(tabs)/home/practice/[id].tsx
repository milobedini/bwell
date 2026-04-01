import { useLocalSearchParams } from 'expo-router';
import PracticeItemDetail from '@/components/practice/PracticeItemDetail';

export default function HomePracticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PracticeItemDetail assignmentId={id} />;
}
