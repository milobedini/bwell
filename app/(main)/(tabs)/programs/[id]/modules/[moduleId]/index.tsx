import { ScrollView, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModuleSummary from '@/components/module/ModuleSummary';
import QuestionsPresenter from '@/components/module/QuestionsPresenter';
import ScoreBandsPresenter from '@/components/module/ScoreBandsPresenter';
import { ThemedText } from '@/components/ThemedText';
import { useModuleById } from '@/hooks/useModules';
import { useAuthStore } from '@/stores/authStore';
import { ModuleType } from '@/types/types';
import { isAdminOrTherapist } from '@/utils/userRoles';

const ModuleDetail = () => {
  const moduleId = useLocalSearchParams().moduleId;
  const user = useAuthStore((s) => s.user);
  const { data, isPending, isError } = useModuleById(moduleId as string);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  const { module, questions, scoreBands } = data;

  return (
    <Container>
      <ContentContainer>
        <ScrollView>
          {/* Module Summary */}
          <View className="gap-2">
            <ModuleSummary module={module} />
            <Divider bold className="mb-4" />
          </View>
          {/* Todo - separate switch cases for module types, below is all questionnaire based. */}
          {/* Main Content */}
          {isAdminOrTherapist(user) && (
            <View className="gap-4">
              <ThemedText type="title">Contents</ThemedText>
              <View>
                {module.type === ModuleType.QUESTIONNAIRE && questions && !!questions.length && (
                  <QuestionsPresenter questions={questions} />
                )}
              </View>
              <View>{scoreBands && !!scoreBands.length && <ScoreBandsPresenter scoreBands={scoreBands} />}</View>
            </View>
          )}
        </ScrollView>
      </ContentContainer>
    </Container>
  );
};

export default ModuleDetail;
