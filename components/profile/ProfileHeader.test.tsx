import type { ProfileResponse } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => <Text>{name}</Text>
  };
});

const ProfileHeader = require('./ProfileHeader').default;

const baseProfile: ProfileResponse = {
  _id: '1',
  username: 'janedoe',
  email: 'jane@example.com',
  name: 'Jane Doe',
  roles: ['patient'],
  isVerifiedTherapist: false,
  patients: [],
  therapist: null,
  createdAt: '2025-06-15T10:00:00.000Z'
};

describe('ProfileHeader', () => {
  it('renders patient name and username', () => {
    render(<ProfileHeader profile={baseProfile} />);

    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('@janedoe')).toBeTruthy();
  });

  it('shows username as display name when no name set', () => {
    const noName = { ...baseProfile, name: undefined };
    render(<ProfileHeader profile={noName} />);

    expect(screen.getByText('janedoe')).toBeTruthy();
    expect(screen.queryByText('@janedoe')).toBeNull();
  });

  it('shows initials from full name', () => {
    render(<ProfileHeader profile={baseProfile} />);

    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('shows Patient role badge for patient', () => {
    render(<ProfileHeader profile={baseProfile} />);

    expect(screen.getByText('Patient')).toBeTruthy();
  });

  it('shows Therapist badge with verified status', () => {
    const therapistProfile: ProfileResponse = {
      ...baseProfile,
      roles: ['therapist'],
      isVerifiedTherapist: true
    };
    render(<ProfileHeader profile={therapistProfile} />);

    expect(screen.getByText('Therapist')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('shows Pending for unverified therapist', () => {
    const therapistProfile: ProfileResponse = {
      ...baseProfile,
      roles: ['therapist'],
      isVerifiedTherapist: false
    };
    render(<ProfileHeader profile={therapistProfile} />);

    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('shows member since date', () => {
    render(<ProfileHeader profile={baseProfile} />);

    expect(screen.getByText('Member since Jun 2025')).toBeTruthy();
  });
});
