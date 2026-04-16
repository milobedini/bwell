import type { AuthUser } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => <Text>{name}</Text>
  };
});

const ClientsSummaryCard = require('./ClientsSummaryCard').default;

const makeClient = (id: string, name?: string): AuthUser => ({
  _id: id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  name,
  roles: ['patient']
});

describe('ClientsSummaryCard', () => {
  it('shows empty state when no clients', () => {
    const onPress = jest.fn();
    render(<ClientsSummaryCard clients={[]} onPress={onPress} />);

    expect(screen.getByText('No clients yet')).toBeTruthy();
  });

  it('renders client count for single client', () => {
    const onPress = jest.fn();
    render(<ClientsSummaryCard clients={[makeClient('1', 'Alice Smith')]} onPress={onPress} />);

    expect(screen.getByText('1 client')).toBeTruthy();
  });

  it('renders plural client count', () => {
    const onPress = jest.fn();
    const clients = [makeClient('1', 'Alice'), makeClient('2', 'Bob')];
    render(<ClientsSummaryCard clients={clients} onPress={onPress} />);

    expect(screen.getByText('2 clients')).toBeTruthy();
  });

  it('shows overflow count for more than 4 clients', () => {
    const onPress = jest.fn();
    const clients = Array.from({ length: 6 }, (_, i) => makeClient(String(i), `Client ${i}`));
    render(<ClientsSummaryCard clients={clients} onPress={onPress} />);

    expect(screen.getByText('+2')).toBeTruthy();
    expect(screen.getByText('6 clients')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<ClientsSummaryCard clients={[makeClient('1', 'Alice')]} onPress={onPress} />);

    fireEvent.press(screen.getByTestId('clients-summary-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
