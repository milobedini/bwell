import { useLocalSearchParams } from 'expo-router';
import ProgrammeDetailScreen from '@/components/home/admin-dashboard/ProgrammeDetailScreen';

export default function AdminProgrammeDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string; headerTitle?: string }>();
  return <ProgrammeDetailScreen programmeId={id} />;
}
