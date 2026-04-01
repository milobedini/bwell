import { useLocalSearchParams } from 'expo-router';
import PracticeItemDetail from '@/components/practice/PracticeItemDetail';

export default function HomePracticeDetailScreen() {
  const { id, attemptId } = useLocalSearchParams<{ id: string; attemptId?: string }>();
  return <PracticeItemDetail assignmentId={id} attemptIdParam={attemptId} />;
}
