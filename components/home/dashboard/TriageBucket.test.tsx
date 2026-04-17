import type { DashboardClientItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import TriageBucket from './TriageBucket';

jest.mock('./ClientCard', () => {
  const { View, Text } = require('react-native');
  return (props: { item: { patient: { name: string } } }) => (
    <View testID="client-card">
      <Text>{props.item.patient.name}</Text>
    </View>
  );
});

const makeItem = (id: string, name: string): DashboardClientItem => ({
  patient: { _id: id, name, username: name.toLowerCase(), email: `${name.toLowerCase()}@test.com` },
  reasons: [],
  lastActive: null,
  latestScore: null,
  previousScore: null,
  assignments: { completedThisWeek: 0, overdueTotal: 0, pendingThisWeek: 0 }
});

describe('TriageBucket', () => {
  it('returns null when items is empty', () => {
    const { toJSON } = render(<TriageBucket type="attention" items={[]} />);

    expect(toJSON()).toBeNull();
  });

  it('renders bucket label for attention', () => {
    render(<TriageBucket type="attention" items={[makeItem('1', 'Alice')]} />);

    expect(screen.getByText('NEEDS ATTENTION')).toBeTruthy();
  });

  it('renders bucket label for completed', () => {
    render(<TriageBucket type="completed" items={[makeItem('1', 'Alice')]} />);

    expect(screen.getByText('COMPLETED THIS WEEK')).toBeTruthy();
  });

  it('renders bucket label for inactive', () => {
    render(<TriageBucket type="inactive" items={[makeItem('1', 'Alice')]} />);

    expect(screen.getByText('NO SUBMISSIONS THIS WEEK')).toBeTruthy();
  });

  it('shows item count badge', () => {
    const items = [makeItem('1', 'Alice'), makeItem('2', 'Bob')];
    render(<TriageBucket type="attention" items={items} />);

    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders ClientCard for each item', () => {
    const items = [makeItem('1', 'Alice'), makeItem('2', 'Bob')];
    render(<TriageBucket type="attention" items={items} />);

    expect(screen.getAllByTestId('client-card')).toHaveLength(2);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });
});
