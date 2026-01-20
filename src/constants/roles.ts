import { UserRole, Permission } from '@/types/user';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  DRIVER: [
    'VIEW_ROUTES',
    'COLLECT_WASTE',
  ],
  MANAGER: [
    'VIEW_ROUTES',
    'COLLECT_WASTE',
    'VIEW_STATISTICS',
  ],
  ADMIN: [
    'VIEW_ROUTES',
    'COLLECT_WASTE',
    'MANAGE_ROUTES',
    'MANAGE_ADDRESSES',
    'MANAGE_USERS',
    'VIEW_STATISTICS',
    'MANAGE_SETTINGS',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  DRIVER: 'Kierowca',
  MANAGER: 'Manager',
  ADMIN: 'Administrator',
};

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
};

export const hasAnyPermission = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};
