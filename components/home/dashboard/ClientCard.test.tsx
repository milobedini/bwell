import type { ReactNode } from 'react';
import type { DashboardClientItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import ClientCard from './ClientCard';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children
}));

jest.mock('@/utils/dates', () => ({
  formatRelativeTime: () => '2h ago'
}));

jest.mock('@/utils/severity', () => ({
  getSeverityColors: () => ({ pillBg: '#f00', text: '#fff' })
}));

const makeItem = (overrides: Partial<DashboardClientItem> = {}): DashboardClientItem => ({
  patient: { _id: 'p1', name: 'John Doe', username: 'johndoe', email: 'john@test.com' },
  reasons: [],
  lastActive: '2026-01-01',
  latestScore: {
    moduleTitle: 'PHQ-9',
    moduleId: 'm1',
    score: 15,
    band: 'moderate',
    scoreBandLabel: 'Moderate',
    submittedAt: '2026-01-01'
  },
  previousScore: { score: 12 },
  assignments: { completedThisWeek: 2, overdueTotal: 1, pendingThisWeek: 3 },
  ...overrides
});

describe('ClientCard', () => {
  it('renders patient name', () => {
    render(<ClientCard item={makeItem()} bucket="completed" />);

    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('shows "Never" when no lastActive', () => {
    render(<ClientCard item={makeItem({ lastActive: null })} bucket="completed" />);

    expect(screen.getByText('Never')).toBeTruthy();
  });

  it('shows relative time when lastActive provided', () => {
    render(<ClientCard item={makeItem()} bucket="completed" />);

    expect(screen.getByText('2h ago')).toBeTruthy();
  });

  it('shows score badge with module title and score', () => {
    render(<ClientCard item={makeItem()} bucket="completed" />);

    expect(screen.getByText('PHQ-9: 15')).toBeTruthy();
  });

  it('shows "No scores" when no latestScore', () => {
    render(<ClientCard item={makeItem({ latestScore: null })} bucket="completed" />);

    expect(screen.getByText('No scores')).toBeTruthy();
  });

  it('shows reason tags for attention bucket', () => {
    const item = makeItem({ reasons: ['severe_score', 'overdue', 'worsening'] });
    render(<ClientCard item={item} bucket="attention" />);

    expect(screen.getByText('Severe')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
    expect(screen.getByText('Worsening')).toBeTruthy();
  });

  it('does not show reason tags for non-attention buckets', () => {
    const item = makeItem({ reasons: ['severe_score'] });
    render(<ClientCard item={item} bucket="completed" />);

    expect(screen.queryByText('Severe')).toBeNull();
  });

  it('shows "No assignments this week" when total is 0', () => {
    const item = makeItem({
      assignments: { completedThisWeek: 0, overdueTotal: 0, pendingThisWeek: 0 }
    });
    render(<ClientCard item={item} bucket="completed" />);

    expect(screen.getByText('No assignments this week')).toBeTruthy();
  });

  it('shows completion segments with counts', () => {
    render(<ClientCard item={makeItem()} bucket="completed" />);

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText(/done/)).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText(/overdue/)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/pending/)).toBeTruthy();
  });

  it('shows score delta arrow when previous score exists and diff > 0', () => {
    const item = makeItem({
      latestScore: {
        moduleTitle: 'PHQ-9',
        moduleId: 'm1',
        score: 15,
        band: 'moderate',
        scoreBandLabel: 'Moderate',
        submittedAt: '2026-01-01'
      },
      previousScore: { score: 12 }
    });
    render(<ClientCard item={item} bucket="completed" />);

    expect(screen.getByText(/▲ 3/)).toBeTruthy();
  });

  it('shows "— 0" when score delta is zero', () => {
    const item = makeItem({
      latestScore: {
        moduleTitle: 'PHQ-9',
        moduleId: 'm1',
        score: 15,
        band: 'moderate',
        scoreBandLabel: 'Moderate',
        submittedAt: '2026-01-01'
      },
      previousScore: { score: 15 }
    });
    render(<ClientCard item={item} bucket="completed" />);

    expect(screen.getByText('— 0')).toBeTruthy();
  });

  it('shows down arrow when score decreased', () => {
    const item = makeItem({
      latestScore: {
        moduleTitle: 'PHQ-9',
        moduleId: 'm1',
        score: 10,
        band: 'moderate',
        scoreBandLabel: 'Moderate',
        submittedAt: '2026-01-01'
      },
      previousScore: { score: 15 }
    });
    render(<ClientCard item={item} bucket="completed" />);

    expect(screen.getByText(/▼ 5/)).toBeTruthy();
  });

  it('shows overflow "+N" when more than 6 assignment dots', () => {
    const item = makeItem({
      assignments: { completedThisWeek: 4, overdueTotal: 2, pendingThisWeek: 3 }
    });
    render(<ClientCard item={item} bucket="completed" />);

    expect(screen.getByText('+3')).toBeTruthy();
  });
});
