import { UserRole } from '@/types/types';
import type { AuthUser, ProfileResponse } from '@milobedini/shared-types';

const displayUserRoles = (roles: AuthUser['roles']): string => {
  return roles.join(', ');
};

const isAdmin = (roles?: AuthUser['roles']): boolean => {
  if (!roles) return false;
  return roles.includes(UserRole.ADMIN);
};

const isTherapist = (roles?: AuthUser['roles']): boolean => {
  if (!roles) return false;
  return roles.includes(UserRole.THERAPIST);
};

const isPatient = (roles?: AuthUser['roles']): boolean => {
  if (!roles) return false;
  return roles.includes(UserRole.PATIENT);
};

const isVerifiedTherapist = (user: AuthUser | ProfileResponse | null): boolean => {
  if (!user) return false;
  if (!user.roles || !user.roles.length) return false;
  if (user.roles.includes(UserRole.THERAPIST) && user.isVerifiedTherapist) return true;
  return false;
};

const isAdminOrTherapist = (user: AuthUser | ProfileResponse | null): boolean => {
  if (!user) return false;
  return isAdmin(user.roles) || isTherapist(user.roles);
};

export { displayUserRoles, isAdmin, isAdminOrTherapist, isPatient, isTherapist, isVerifiedTherapist };
