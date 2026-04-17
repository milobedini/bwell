import type { DashboardStats, PatientProfileStatsResponse } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

const { PatientStats, TherapistStats, StatsStripSkeleton } = require('./ProfileStatsStrip');

describe('PatientStats', () => {
  it('renders last completion, sessions, and assignments', () => {
    const stats: PatientProfileStatsResponse = {
      latestCompletion: {
        attemptId: 'a1',
        moduleTitle: 'PHQ-9',
        completedAt: new Date(Date.now() - 3_600_000).toISOString() // 1h ago
      },
      sessionsThisWeek: 3,
      assignmentsDue: 2
    };
    render(<PatientStats stats={stats} />);

    expect(screen.getByText('LAST DONE')).toBeTruthy();
    expect(screen.getByText('1h ago')).toBeTruthy();
    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('COMPLETED')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('HOMEWORK')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Assignments due')).toBeTruthy();
  });

  it('shows dashes when no completions', () => {
    const stats: PatientProfileStatsResponse = {
      latestCompletion: null,
      sessionsThisWeek: 0,
      assignmentsDue: 0
    };
    render(<PatientStats stats={stats} />);

    expect(screen.getByText('--')).toBeTruthy();
    expect(screen.getByText('Nothing yet')).toBeTruthy();
  });

  it('shows singular label for single assignment due', () => {
    const stats: PatientProfileStatsResponse = {
      latestCompletion: null,
      sessionsThisWeek: 0,
      assignmentsDue: 1
    };
    render(<PatientStats stats={stats} />);

    expect(screen.getByText('Assignment due')).toBeTruthy();
  });
});

describe('TherapistStats', () => {
  it('renders all therapist stats with clear labels', () => {
    const stats: DashboardStats = {
      totalClients: 8,
      needsAttention: 2,
      submittedThisWeek: 5,
      overdueAssignments: 1
    };
    render(<TherapistStats stats={stats} />);

    expect(screen.getByText('CLIENTS')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Need attention')).toBeTruthy();
    expect(screen.getByText('SUBMITTED')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('HOMEWORK')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
  });
});

describe('StatsStripSkeleton', () => {
  it('renders without crashing', () => {
    render(<StatsStripSkeleton />);

    expect(screen.getByTestId('stats-strip-skeleton')).toBeTruthy();
  });
});
