import type { UsersListItem } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('../ui/Chip', () => {
  const { Text } = require('react-native');
  return { StatusChip: (props: { label: string }) => <Text>{props.label}</Text> };
});

const UserListItem = require('./UserListItem').default;

const makeUser = (overrides: Partial<UsersListItem> = {}): UsersListItem =>
  ({
    _id: 'u1',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    roles: ['patient'],
    isVerified: true,
    isVerifiedTherapist: false,
    lastLogin: '2026-01-15T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    therapistInfo: null,
    ...overrides
  }) as UsersListItem;

describe('UserListItem', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T10:00:30Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders user name as primary display', () => {
    render(<UserListItem user={makeUser()} />);
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('falls back to username when name is not provided', () => {
    render(<UserListItem user={makeUser({ name: undefined })} />);
    expect(screen.getByText('johndoe')).toBeTruthy();
  });

  it('shows @username when name is provided', () => {
    render(<UserListItem user={makeUser()} />);
    expect(screen.getByText('@johndoe')).toBeTruthy();
  });

  it('does not show @username when name is absent', () => {
    render(<UserListItem user={makeUser({ name: undefined })} />);
    expect(screen.queryByText('@johndoe')).toBeNull();
  });

  it('shows email', () => {
    render(<UserListItem user={makeUser()} />);
    expect(screen.getByText('john@example.com')).toBeTruthy();
  });

  it('shows role badge with capitalised label', () => {
    render(<UserListItem user={makeUser({ roles: ['patient'] })} />);
    expect(screen.getByText('Patient')).toBeTruthy();
  });

  it('shows multiple role badges', () => {
    render(<UserListItem user={makeUser({ roles: ['patient', 'admin'] })} />);
    expect(screen.getByText('Patient')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('shows "Email unverified" chip when isVerified is false', () => {
    render(<UserListItem user={makeUser({ isVerified: false })} />);
    expect(screen.getByText('Email unverified')).toBeTruthy();
  });

  it('does not show "Email unverified" chip when isVerified is true', () => {
    render(<UserListItem user={makeUser({ isVerified: true })} />);
    expect(screen.queryByText('Email unverified')).toBeNull();
  });

  it('shows "Verified therapist" chip for verified therapist', () => {
    render(<UserListItem user={makeUser({ roles: ['therapist'], isVerifiedTherapist: true })} />);
    expect(screen.getByText('Verified therapist')).toBeTruthy();
  });

  it('shows "Unverified therapist" chip for unverified therapist', () => {
    render(<UserListItem user={makeUser({ roles: ['therapist'], isVerifiedTherapist: false })} />);
    expect(screen.getByText('Unverified therapist')).toBeTruthy();
  });

  it('does not show therapist verification chip for non-therapist roles', () => {
    render(<UserListItem user={makeUser({ roles: ['patient'] })} />);
    expect(screen.queryByText('Verified therapist')).toBeNull();
    expect(screen.queryByText('Unverified therapist')).toBeNull();
  });

  it('shows therapist info when present', () => {
    render(
      <UserListItem
        user={makeUser({
          therapistInfo: { name: 'Dr Smith', username: 'drsmith' } as UsersListItem['therapistInfo']
        })}
      />
    );
    expect(screen.getByText('Therapist: Dr Smith')).toBeTruthy();
  });

  it('shows therapist username when therapist name is absent', () => {
    render(
      <UserListItem
        user={makeUser({
          therapistInfo: { name: undefined, username: 'drsmith' } as unknown as UsersListItem['therapistInfo']
        })}
      />
    );
    expect(screen.getByText('Therapist: drsmith')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    render(<UserListItem user={makeUser()} onPress={onPress} />);
    fireEvent.press(screen.getByText('John Doe'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // formatRelativeTime tests via timestamp display
  it('shows "Just now" for lastLogin less than 1 minute ago', () => {
    render(<UserListItem user={makeUser({ lastLogin: '2026-01-15T10:00:00Z' })} />);
    expect(screen.getByText('Just now')).toBeTruthy();
  });

  it('shows "Nm ago" for minutes', () => {
    jest.setSystemTime(new Date('2026-01-15T10:05:00Z'));
    render(<UserListItem user={makeUser({ lastLogin: '2026-01-15T10:00:00Z' })} />);
    expect(screen.getByText('5m ago')).toBeTruthy();
  });

  it('shows "Nh ago" for hours', () => {
    jest.setSystemTime(new Date('2026-01-15T13:00:00Z'));
    render(<UserListItem user={makeUser({ lastLogin: '2026-01-15T10:00:00Z' })} />);
    expect(screen.getByText('3h ago')).toBeTruthy();
  });

  it('shows "Nd ago" for days', () => {
    jest.setSystemTime(new Date('2026-01-18T10:00:00Z'));
    render(<UserListItem user={makeUser({ lastLogin: '2026-01-15T10:00:00Z' })} />);
    expect(screen.getByText('3d ago')).toBeTruthy();
  });

  it('shows "Nmo ago" for months', () => {
    jest.setSystemTime(new Date('2026-04-15T10:00:00Z'));
    render(<UserListItem user={makeUser({ lastLogin: '2026-01-15T10:00:00Z' })} />);
    expect(screen.getByText('3mo ago')).toBeTruthy();
  });

  it('shows "Never" when lastLogin is undefined', () => {
    render(<UserListItem user={makeUser({ lastLogin: undefined })} />);
    expect(screen.getByText('Never')).toBeTruthy();
  });

  it('shows "Created" prefix for createdAt:desc sort', () => {
    jest.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    render(<UserListItem user={makeUser({ createdAt: '2026-01-01T00:00:00Z' })} sort="createdAt:desc" />);
    expect(screen.getByText(/Created\s/)).toBeTruthy();
    expect(screen.getByText(/2d ago/)).toBeTruthy();
  });

  it('shows "Created" prefix for createdAt:asc sort', () => {
    jest.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    render(<UserListItem user={makeUser({ createdAt: '2026-01-01T00:00:00Z' })} sort="createdAt:asc" />);
    expect(screen.getByText(/Created\s/)).toBeTruthy();
  });

  it('shows lastLogin time for lastLogin:desc sort', () => {
    jest.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    render(<UserListItem user={makeUser({ lastLogin: '2026-01-15T10:00:00Z' })} sort="lastLogin:desc" />);
    expect(screen.getByText('2h ago')).toBeTruthy();
  });
});
