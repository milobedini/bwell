import type { AuthUser } from '@milobedini/shared-types';

import { useAuthStore } from './authStore';

const mockUser = {
  _id: 'u1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  roles: ['patient'],
  isVerified: true,
  isVerifiedTherapist: false
} as AuthUser;

describe('authStore', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useAuthStore.setState({ user: null });
  });

  it('starts with null user', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('sets user via setUser', () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('clears user via clearUser', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('replaces user when setUser called again', () => {
    useAuthStore.getState().setUser(mockUser);

    const newUser = { ...mockUser, _id: 'u2', name: 'Another User' };
    useAuthStore.getState().setUser(newUser);

    expect(useAuthStore.getState().user).toEqual(newUser);
    expect(useAuthStore.getState().user?._id).toBe('u2');
  });
});
