import TherapistAttemptDetail from '@/components/attempts/TherapistAttemptDetail';

// TherapistAttemptDetail reads its own `id` param via useLocalSearchParams,
// so we render it directly without passing props.
export default function ReviewDetailScreen() {
  return <TherapistAttemptDetail />;
}
