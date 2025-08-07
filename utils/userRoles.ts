import { AuthUser } from '@milobedini/shared-types';

const displayUserRoles = (roles: AuthUser['roles']): string => {
  return roles.join(', ');
};

const isTherapist = (roles: AuthUser['roles']): boolean => {
  return roles.includes('therapist');
};

export { displayUserRoles, isTherapist };
