import { useLocalSearchParams } from 'expo-router';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModulesList from '@/components/module/ModulesList';
import { useModules } from '@/hooks/useModules';

export default function ProgramDetail() {
  const { id } = useLocalSearchParams();
  const { data, isError, isPending } = useModules({ programId: id as string, withMeta: true });

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data || !data.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <ModulesList data={data} />
    </Container>
  );
}
