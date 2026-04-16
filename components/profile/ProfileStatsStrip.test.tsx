import type { DashboardStats, PatientProfileStatsResponse } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => <Text>{name}</Text>
  };
});

const { PatientStats, TherapistStats, StatsStripSkeleton } = require('./ProfileStatsStrip');

describe('PatientStats', () => {
  it('renders score, sessions, and assignments due', () => {
    const stats: PatientProfileStatsResponse = {
      latestScore: { moduleTitle: 'PHQ-9', score: 12, band: 'Moderate', trend: 'improving' },
      sessionsThisWeek: 3,
      assignmentsDue: 2
    };
    render(<PatientStats stats={stats} />);

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
    expect(screen.getByText('Improving')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('shows dashes when no latest score', () => {
    const stats: PatientProfileStatsResponse = {
      latestScore: null,
      sessionsThisWeek: 0,
      assignmentsDue: 0
    };
    render(<PatientStats stats={stats} />);

    expect(screen.getByText('--')).toBeTruthy();
    expect(screen.getByText('Score')).toBeTruthy();
  });

  it('renders with worsening trend', () => {
    const stats: PatientProfileStatsResponse = {
      latestScore: { moduleTitle: 'GAD-7', score: 18, band: 'Severe', trend: 'worsening' },
      sessionsThisWeek: 1,
      assignmentsDue: 0
    };
    render(<PatientStats stats={stats} />);

    expect(screen.getByText('Worsening')).toBeTruthy();
  });
});

describe('TherapistStats', () => {
  it('renders all therapist stats', () => {
    const stats: DashboardStats = {
      totalClients: 8,
      needsAttention: 2,
      submittedThisWeek: 5,
      overdueAssignments: 1
    };
    render(<TherapistStats stats={stats} />);

    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('Clients')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Attention')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Submitted')).toBeTruthy();
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
