import { UserRole } from '@/types/types';
import type { AuthUser } from '@milobedini/shared-types';

import {
  displayUserRoles,
  isAdmin,
  isAdminOrTherapist,
  isPatient,
  isTherapist,
  isVerifiedTherapist
} from './userRoles';

describe('displayUserRoles', () => {
  it('joins roles with comma', () => {
    expect(displayUserRoles(['patient', 'therapist'])).toBe('patient, therapist');
  });

  it('returns single role as-is', () => {
    expect(displayUserRoles(['admin'])).toBe('admin');
  });

  it('returns empty string for empty array', () => {
    expect(displayUserRoles([])).toBe('');
  });
});

describe('isAdmin', () => {
  it('returns true when roles include admin', () => {
    expect(isAdmin([UserRole.ADMIN])).toBe(true);
  });

  it('returns false when roles do not include admin', () => {
    expect(isAdmin([UserRole.PATIENT])).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('isTherapist', () => {
  it('returns true when roles include therapist', () => {
    expect(isTherapist([UserRole.THERAPIST])).toBe(true);
  });

  it('returns false when roles do not include therapist', () => {
    expect(isTherapist([UserRole.PATIENT])).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isTherapist(undefined)).toBe(false);
  });
});

describe('isPatient', () => {
  it('returns true when roles include patient', () => {
    expect(isPatient([UserRole.PATIENT])).toBe(true);
  });

  it('returns false when roles do not include patient', () => {
    expect(isPatient([UserRole.ADMIN])).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPatient(undefined)).toBe(false);
  });
});

describe('isVerifiedTherapist', () => {
  it('returns true for verified therapist', () => {
    const user = { roles: [UserRole.THERAPIST], isVerifiedTherapist: true } as AuthUser;
    expect(isVerifiedTherapist(user)).toBe(true);
  });

  it('returns false for unverified therapist', () => {
    const user = { roles: [UserRole.THERAPIST], isVerifiedTherapist: false } as AuthUser;
    expect(isVerifiedTherapist(user)).toBe(false);
  });

  it('returns false for patient', () => {
    const user = { roles: [UserRole.PATIENT], isVerifiedTherapist: false } as AuthUser;
    expect(isVerifiedTherapist(user)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isVerifiedTherapist(null)).toBe(false);
  });

  it('returns false for user with empty roles', () => {
    const user = { roles: [] } as unknown as AuthUser;
    expect(isVerifiedTherapist(user)).toBe(false);
  });
});

describe('isAdminOrTherapist', () => {
  it('returns true for admin', () => {
    const user = { roles: [UserRole.ADMIN] } as AuthUser;
    expect(isAdminOrTherapist(user)).toBe(true);
  });

  it('returns true for therapist', () => {
    const user = { roles: [UserRole.THERAPIST] } as AuthUser;
    expect(isAdminOrTherapist(user)).toBe(true);
  });

  it('returns false for patient only', () => {
    const user = { roles: [UserRole.PATIENT] } as AuthUser;
    expect(isAdminOrTherapist(user)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdminOrTherapist(null)).toBe(false);
  });
});
