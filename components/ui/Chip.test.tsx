import { AccessPolicy, AssignmentStatus, CanStartReason } from '@/types/types';
import type { AssignmentRecurrence, AvailableModulesItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import {
  AccessPolicyChip,
  AssignmentStatusChip,
  CanStartChip,
  DateChip,
  DueChip,
  PendingChip,
  RecurrenceChip,
  SaveProgressChip,
  StatusChip,
  TimeLeftChip
} from './Chip';

jest.mock('lottie-react-native', () => 'LottieView');

describe('StatusChip', () => {
  it('renders label text', () => {
    render(<StatusChip label="Active" color="#fff" borderColor="#000" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
});

describe('PendingChip', () => {
  it('renders pending verification label', () => {
    render(<PendingChip />);
    expect(screen.getByText('Pending verification')).toBeTruthy();
  });
});

describe('AccessPolicyChip', () => {
  it('renders "Assigned" for ASSIGNED policy', () => {
    render(<AccessPolicyChip accessPolicy={AccessPolicy.ASSIGNED} />);
    expect(screen.getByText('Assigned')).toBeTruthy();
  });

  it('renders "Open" for OPEN policy', () => {
    render(<AccessPolicyChip accessPolicy={AccessPolicy.OPEN} />);
    expect(screen.getByText('Open')).toBeTruthy();
  });
});

describe('CanStartChip', () => {
  it('renders "Ready" when canStart is true', () => {
    const meta: AvailableModulesItem['meta'] = { canStart: true, canStartReason: 'ok', source: ['open'] };
    render(<CanStartChip meta={meta} />);
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  it('renders "Needs assignment" when blocked by assignment', () => {
    const meta: AvailableModulesItem['meta'] = {
      canStart: false,
      canStartReason: CanStartReason.REQUIRES_ASSIGNMENT,
      source: ['assigned']
    };
    render(<CanStartChip meta={meta} />);
    expect(screen.getByText('Needs assignment')).toBeTruthy();
  });

  it('renders "Sign in" for unauthenticated reason', () => {
    const meta: AvailableModulesItem['meta'] = {
      canStart: false,
      canStartReason: CanStartReason.UNAUTHENTICATED,
      source: []
    };
    render(<CanStartChip meta={meta} />);
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});

describe('AssignmentStatusChip', () => {
  it('renders "Assigned" for assigned status', () => {
    render(<AssignmentStatusChip status={AssignmentStatus.ASSIGNED} />);
    expect(screen.getByText('Assigned')).toBeTruthy();
  });

  it('renders "In progress" for in_progress status', () => {
    render(<AssignmentStatusChip status={AssignmentStatus.IN_PROGRESS} />);
    expect(screen.getByText('In progress')).toBeTruthy();
  });

  it('returns null for unknown status', () => {
    const { toJSON } = render(<AssignmentStatusChip status={'completed' as 'assigned'} />);
    expect(toJSON()).toBeNull();
  });
});

describe('DueChip', () => {
  it('renders "No deadline" when dueAt is undefined', () => {
    render(<DueChip />);
    expect(screen.getByText('No deadline')).toBeTruthy();
  });

  it('renders "Completed" with date when completed', () => {
    render(<DueChip dueAt="2025-06-15T00:00:00Z" completed />);
    expect(screen.getByText(/^Completed/)).toBeTruthy();
  });

  it('renders "Due" with date when not completed', () => {
    render(<DueChip dueAt="2025-06-15T00:00:00Z" />);
    expect(screen.getByText(/^Due/)).toBeTruthy();
  });
});

describe('TimeLeftChip', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns null for invalid date', () => {
    const { toJSON } = render(<TimeLeftChip dueAt="not-a-date" />);
    expect(toJSON()).toBeNull();
  });

  it('renders "Overdue" when due date is in the past', () => {
    jest.setSystemTime(new Date('2025-06-20T12:00:00Z'));
    render(<TimeLeftChip dueAt="2025-06-19T00:00:00Z" />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('renders hours left when under 24 hours', () => {
    jest.setSystemTime(new Date('2025-06-15T10:00:00Z'));
    render(<TimeLeftChip dueAt="2025-06-15T20:00:00Z" />);
    expect(screen.getByText(/hours? left/)).toBeTruthy();
  });

  it('renders days left when more than 24 hours', () => {
    jest.setSystemTime(new Date('2025-06-10T00:00:00Z'));
    render(<TimeLeftChip dueAt="2025-06-15T00:00:00Z" />);
    expect(screen.getByText('5 days left')).toBeTruthy();
  });

  it('renders "1 day left" for singular', () => {
    jest.setSystemTime(new Date('2025-06-14T00:00:00Z'));
    render(<TimeLeftChip dueAt="2025-06-15T00:00:00Z" />);
    expect(screen.getByText('1 day left')).toBeTruthy();
  });
});

describe('RecurrenceChip', () => {
  it('returns null for freq "none"', () => {
    const { toJSON } = render(<RecurrenceChip recurrence={{ freq: 'none', interval: 1 }} />);
    expect(toJSON()).toBeNull();
  });

  it('returns null when freq is missing', () => {
    const { toJSON } = render(<RecurrenceChip recurrence={{} as AssignmentRecurrence} />);
    expect(toJSON()).toBeNull();
  });

  it('renders "Weekly" for weekly with interval 1', () => {
    render(<RecurrenceChip recurrence={{ freq: 'weekly', interval: 1 }} />);
    expect(screen.getByText('Weekly')).toBeTruthy();
  });

  it('renders "Biweekly" for weekly with interval 2', () => {
    render(<RecurrenceChip recurrence={{ freq: 'weekly', interval: 2 }} />);
    expect(screen.getByText('Biweekly')).toBeTruthy();
  });

  it('renders "Every 3w" for weekly with interval 3', () => {
    render(<RecurrenceChip recurrence={{ freq: 'weekly', interval: 3 }} />);
    expect(screen.getByText('Every 3w')).toBeTruthy();
  });

  it('renders "Monthly" for monthly with interval 1', () => {
    render(<RecurrenceChip recurrence={{ freq: 'monthly', interval: 1 }} />);
    expect(screen.getByText('Monthly')).toBeTruthy();
  });

  it('renders "Every 2m" for monthly with interval 2', () => {
    render(<RecurrenceChip recurrence={{ freq: 'monthly', interval: 2 }} />);
    expect(screen.getByText('Every 2m')).toBeTruthy();
  });

  it('returns null for unsupported freq', () => {
    // 'daily' is not in the union but tests the default branch
    const { toJSON } = render(
      <RecurrenceChip recurrence={{ freq: 'daily' as AssignmentRecurrence['freq'], interval: 1 }} />
    );
    expect(toJSON()).toBeNull();
  });
});

describe('DateChip', () => {
  it('renders date without prefix', () => {
    render(<DateChip dateString="2025-06-15T00:00:00Z" />);
    expect(screen.getByText(/6\/15\/2025|15\/06\/2025/)).toBeTruthy();
  });

  it('renders date with prefix', () => {
    render(<DateChip dateString="2025-06-15T00:00:00Z" prefix="From" />);
    expect(screen.getByText(/^From/)).toBeTruthy();
  });
});

describe('SaveProgressChip', () => {
  it('returns null when neither saving nor saved', () => {
    const { toJSON } = render(<SaveProgressChip isSaving={false} saved={false} />);
    expect(toJSON()).toBeNull();
  });

  it('renders "Saving" when saving', () => {
    render(<SaveProgressChip isSaving={true} saved={false} />);
    expect(screen.getByText('Saving')).toBeTruthy();
  });

  it('renders "Saved" when saved', () => {
    render(<SaveProgressChip isSaving={false} saved={true} />);
    expect(screen.getByText('Saved')).toBeTruthy();
  });
});
