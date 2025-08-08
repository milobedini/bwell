import { UserRole } from '@/types/types';
import { AuthUser } from '@milobedini/shared-types';

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

const isVerifiedTherapist = (user: AuthUser | null): boolean => {
  if (!user) return false;
  if (!user.roles || !user.roles.length) return false;
  if (user.roles.includes(UserRole.THERAPIST) && user.isVerifiedTherapist) return true;
  return false;
};

const isAdminOrTherapist = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return isAdmin(user.roles) || isTherapist(user.roles);
};

export { displayUserRoles, isAdmin, isAdminOrTherapist, isTherapist, isVerifiedTherapist };
