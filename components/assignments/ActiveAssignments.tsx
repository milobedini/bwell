import { useAuthStore } from '@/stores/authStore';
import { isPatient } from '@/utils/userRoles';

import Container from '../Container';

import AssignmentsListPatient from './AssignmentsListPatient';

const ActiveAssignments = () => {
  const user = useAuthStore((s) => s.user);

  return <Container>{isPatient(user?.roles) && <AssignmentsListPatient />}</Container>;
};

export default ActiveAssignments;
