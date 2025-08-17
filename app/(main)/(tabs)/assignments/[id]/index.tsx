import { useLocalSearchParams } from 'expo-router';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import { ThemedText } from '@/components/ThemedText';

const AssignmentDetail = () => {
  // TODO: this actually becomes redundant. Takes you to patch, post, view attempts.
  const { id, user } = useLocalSearchParams();

  //   Todo - handle therapist and patient views (therapist read only, patient actions etc)

  return (
    <ScrollContainer>
      <ScrollContentContainer>
        <ThemedText type="title">Assignment Detail {id}</ThemedText>
        <ThemedText type="smallTitle">{user}</ThemedText>
      </ScrollContentContainer>
    </ScrollContainer>
  );
};

export default AssignmentDetail;
