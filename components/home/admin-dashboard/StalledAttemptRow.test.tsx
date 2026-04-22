import type { AdminStalledAttemptRow as AdminStalledAttemptRowType } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import StalledAttemptRow from './StalledAttemptRow';

const buildRow = (overrides: Partial<AdminStalledAttemptRowType> = {}): AdminStalledAttemptRowType => ({
  attemptId: 'a1',
  moduleType: 'questionnaire',
  module: { _id: 'm1', title: 'PHQ-9' },
  user: { _id: 'u1', username: 'patient-a' },
  therapist: { _id: 't1', username: 'therapist-a', isVerifiedTherapist: true },
  startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  lastInteractionAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides
});

describe('StalledAttemptRow', () => {
  it('renders the patient username, module title and therapist username', () => {
    const { getByText } = render(<StalledAttemptRow row={buildRow()} />);
    expect(getByText('patient-a')).toBeTruthy();
    expect(getByText('PHQ-9')).toBeTruthy();
    expect(getByText('Therapist therapist-a')).toBeTruthy();
  });

  it('flags the unverified state on the therapist label', () => {
    const { getByText } = render(
      <StalledAttemptRow
        row={buildRow({ therapist: { _id: 't1', username: 'therapist-a', isVerifiedTherapist: false } })}
      />
    );
    expect(getByText('Therapist therapist-a · unverified')).toBeTruthy();
  });

  it('falls back to "Self-help" when there is no therapist', () => {
    const { getByText } = render(<StalledAttemptRow row={buildRow({ therapist: null })} />);
    expect(getByText('Self-help')).toBeTruthy();
  });
});
