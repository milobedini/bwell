import { render, screen } from '@testing-library/react-native';

import EffortStrip from './EffortStrip';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() }))
}));

describe('EffortStrip', () => {
  it('shows completed/total count', () => {
    render(
      <EffortStrip
        weeklyCompletion={{ completed: 3, total: 5 }}
        onTimeStreak={{ current: 2, history: ['on_time', 'on_time'] }}
      />
    );

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('/5')).toBeTruthy();
  });

  it('shows "Assignments done" when total > 0', () => {
    render(
      <EffortStrip
        weeklyCompletion={{ completed: 3, total: 5 }}
        onTimeStreak={{ current: 2, history: ['on_time', 'on_time'] }}
      />
    );

    expect(screen.getByText('Assignments done')).toBeTruthy();
  });

  it('shows "No assignments yet" when total is 0', () => {
    render(<EffortStrip weeklyCompletion={{ completed: 0, total: 0 }} onTimeStreak={{ current: 0, history: [] }} />);

    expect(screen.getByText('No assignments yet')).toBeTruthy();
  });

  it('shows streak count', () => {
    render(
      <EffortStrip
        weeklyCompletion={{ completed: 0, total: 0 }}
        onTimeStreak={{ current: 4, history: ['on_time', 'late', 'on_time', 'on_time'] }}
      />
    );

    expect(screen.getByText('4')).toBeTruthy();
  });

  it('shows "On-time streak" when history has entries', () => {
    render(
      <EffortStrip
        weeklyCompletion={{ completed: 1, total: 2 }}
        onTimeStreak={{ current: 2, history: ['on_time', 'on_time'] }}
      />
    );

    expect(screen.getByText('On-time streak')).toBeTruthy();
  });

  it('shows "Complete your first on time" when history is empty', () => {
    render(<EffortStrip weeklyCompletion={{ completed: 0, total: 0 }} onTimeStreak={{ current: 0, history: [] }} />);

    expect(screen.getByText('Complete your first on time')).toBeTruthy();
  });
});
