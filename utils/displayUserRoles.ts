import { AuthUser } from '@milobedini/shared-types';

const displayUserRoles = (roles: AuthUser['roles']): string => {
  return roles.join(', ');
};

export { displayUserRoles };
