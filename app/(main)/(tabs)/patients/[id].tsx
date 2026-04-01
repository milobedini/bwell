import { useLocalSearchParams } from 'expo-router';
import PatientPracticeView from '@/components/therapist/PatientPracticeView';

export default function PatientDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  return <PatientPracticeView patientId={id} patientName={name ?? 'Patient'} />;
}
