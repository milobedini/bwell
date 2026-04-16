import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => <Text>{name}</Text>
  };
});

const TherapistCard = require('./TherapistCard').default;

describe('TherapistCard', () => {
  it('shows empty state when no therapist assigned', () => {
    render(<TherapistCard therapist={null} />);

    expect(screen.getByText('No therapist assigned')).toBeTruthy();
    expect(screen.getByText('Contact your provider to get started')).toBeTruthy();
  });

  it('renders therapist name and initials', () => {
    const therapist = { _id: 't1', username: 'drsmith', email: 'dr@example.com', name: 'Dr Smith' };
    render(<TherapistCard therapist={therapist} />);

    expect(screen.getByText('Dr Smith')).toBeTruthy();
    expect(screen.getByText('DS')).toBeTruthy();
  });

  it('uses username when therapist has no name', () => {
    const therapist = { _id: 't1', username: 'drsmith', email: 'dr@example.com' };
    render(<TherapistCard therapist={therapist} />);

    expect(screen.getByText('drsmith')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const therapist = { _id: 't1', username: 'drsmith', email: 'dr@example.com', name: 'Dr Smith' };
    const onPress = jest.fn();
    render(<TherapistCard therapist={therapist} onPress={onPress} />);

    fireEvent.press(screen.getByTestId('therapist-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
