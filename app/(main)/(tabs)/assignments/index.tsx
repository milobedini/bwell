import AssignmentsListPatient from '@/components/assignments/AssignmentsListPatient';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import { useAuthStore } from '@/stores/authStore';
import { isPatient } from '@/utils/userRoles';

const AssignmentsHome = () => {
  // Todo - refactor to active and completed top tabs. This is active.
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollContainer noPadding>
      <ScrollContentContainer noPadding>{isPatient(user?.roles) && <AssignmentsListPatient />}</ScrollContentContainer>
    </ScrollContainer>
  );
};

export default AssignmentsHome;
