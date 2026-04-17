import type { DashboardStats } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import StatStrip from './StatStrip';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush }))
}));

const makeStats = (overrides: Partial<DashboardStats> = {}): DashboardStats => ({
  totalClients: 12,
  needsAttention: 3,
  submittedThisWeek: 8,
  overdueAssignments: 2,
  ...overrides
});

describe('StatStrip', () => {
  const onScrollToBucket = jest.fn();

  it('renders 4 stat pills with correct labels', () => {
    render(<StatStrip stats={makeStats()} onScrollToBucket={onScrollToBucket} />);

    expect(screen.getByText('Clients')).toBeTruthy();
    expect(screen.getByText('Attention')).toBeTruthy();
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('shows stat values', () => {
    render(<StatStrip stats={makeStats()} onScrollToBucket={onScrollToBucket} />);

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('pressing Clients navigates to patients', () => {
    render(<StatStrip stats={makeStats()} onScrollToBucket={onScrollToBucket} />);

    fireEvent.press(screen.getByText('Clients'));

    expect(mockPush).toHaveBeenCalledWith('/(main)/(tabs)/patients');
  });

  it('pressing Attention scrolls to attention bucket', () => {
    render(<StatStrip stats={makeStats()} onScrollToBucket={onScrollToBucket} />);

    fireEvent.press(screen.getByText('Attention'));

    expect(onScrollToBucket).toHaveBeenCalledWith('attention');
  });
});
