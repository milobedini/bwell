import { useLocalSearchParams } from 'expo-router';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModulesList from '@/components/module/ModulesList';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import { useProgram } from '@/hooks/usePrograms';

export default function ProgramDetail() {
  const { id } = useLocalSearchParams();
  const { data: program, isError, isPending } = useProgram(id as string);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!program) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ScrollContainer>
      <ScrollContentContainer>
        <ModulesList modules={program.modules} />
      </ScrollContentContainer>
    </ScrollContainer>
  );
}
