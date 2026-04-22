import type { AdminOrphanedAssignmentRow as AdminOrphanedAssignmentRowType } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import OrphanedAssignmentRow from './OrphanedAssignmentRow';

const buildRow = (overrides: Partial<AdminOrphanedAssignmentRowType> = {}): AdminOrphanedAssignmentRowType => ({
  assignmentId: 'as1',
  moduleType: 'questionnaire',
  module: { _id: 'm1', title: 'PHQ-9' },
  user: { _id: 'u1', username: 'patient-a' },
  therapist: { _id: 't1', username: 'therapist-a', isVerifiedTherapist: false },
  reason: 'therapist_unverified',
  status: 'assigned',
  assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  dueAt: null,
  ...overrides
});

describe('OrphanedAssignmentRow', () => {
  it('renders an unverified-therapist reason when the therapist exists but is unverified', () => {
    const { getByText } = render(<OrphanedAssignmentRow row={buildRow()} />);
    expect(getByText('Therapist @therapist-a is unverified')).toBeTruthy();
    expect(getByText('patient-a')).toBeTruthy();
    expect(getByText('PHQ-9')).toBeTruthy();
  });

  it('renders the missing-therapist reason with error-toned copy', () => {
    const { getByText } = render(
      <OrphanedAssignmentRow row={buildRow({ reason: 'therapist_missing', therapist: null })} />
    );
    expect(getByText('Therapist account deleted')).toBeTruthy();
  });

  it('shows the due label when a due date is set', () => {
    const { getByText } = render(
      <OrphanedAssignmentRow row={buildRow({ dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })} />
    );
    expect(getByText(/^Due /)).toBeTruthy();
  });
});
