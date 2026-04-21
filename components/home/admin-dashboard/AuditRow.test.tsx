import type { AdminAuditEvent, AuditedAction } from '@milobedini/shared-types';
import { fireEvent, render } from '@testing-library/react-native';

import AuditRow from './AuditRow';

const buildEvent = (overrides: Partial<AdminAuditEvent> = {}): AdminAuditEvent => ({
  _id: 'e1',
  actorId: 'a1',
  actor: { _id: 'a1', username: 'admin@bwell.test', name: 'Admin' },
  actorRole: 'admin',
  impersonatorId: null,
  action: 'therapist.verified' satisfies AuditedAction,
  resourceType: 'user',
  resourceId: null,
  outcome: 'success',
  context: { tier: 'cbt' },
  at: new Date(Date.now() - 2 * 60_000).toISOString(),
  ...overrides
});

describe('AuditRow', () => {
  it('renders action, relative time and summary for a high-salience success event', () => {
    const { getByText } = render(<AuditRow event={buildEvent()} />);
    expect(getByText('therapist.verified')).toBeTruthy();
    expect(getByText(/2m ago/)).toBeTruthy();
    expect(getByText(/admin@bwell.test/)).toBeTruthy();
    expect(getByText(/tier=cbt/)).toBeTruthy();
  });

  it('appends "failed" and uses failure styling for failure outcomes', () => {
    const { getByText } = render(
      <AuditRow
        event={buildEvent({
          outcome: 'failure',
          context: { reason: 'missing tier' }
        })}
      />
    );
    expect(getByText('therapist.verified · failed')).toBeTruthy();
    expect(getByText(/missing tier/)).toBeTruthy();
  });

  it('expands to show the context JSON on press when context is present', () => {
    const { getByText, queryByText } = render(<AuditRow event={buildEvent()} />);
    expect(queryByText('Context')).toBeNull();
    fireEvent.press(getByText('therapist.verified'));
    expect(getByText('Context')).toBeTruthy();
    expect(getByText(/"tier": "cbt"/)).toBeTruthy();
  });

  it('does not expand when context is empty', () => {
    const { getByText, queryByText } = render(
      <AuditRow event={buildEvent({ context: undefined, action: 'admin.loggedIn' })} />
    );
    fireEvent.press(getByText('admin.loggedIn'));
    expect(queryByText('Context')).toBeNull();
  });

  it('shortens long resource ids in the summary for read actions', () => {
    const { getByText } = render(
      <AuditRow
        event={buildEvent({
          action: 'user.viewed',
          resourceId: '6742aabbccdd112233ff44a1c',
          context: undefined
        })}
      />
    );
    expect(getByText(/user 6742…a1c/)).toBeTruthy();
  });
});
