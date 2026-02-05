import { useMemo } from 'react';
import { Permission, UserRole } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/constants/roles';

export const usePermissions = () => {
  const { user } = useAuth();
  const userPermissions = user?.permissions ?? [];
  const effectivePermissions = useMemo(() => {
    if (!user) return [];
    const roleDefaults = ROLE_PERMISSIONS[user.role] || [];
    if (userPermissions.length === 0) {
      return roleDefaults;
    }
    return Array.from(new Set([...roleDefaults, ...userPermissions]));
  }, [user, userPermissions]);

  const can = useMemo(() => {
    if (!user) return (permission: Permission) => false;

    return (permission: Permission): boolean => {
      return effectivePermissions.includes(permission);
    };
  }, [user, effectivePermissions]);

  const canAny = useMemo(() => {
    if (!user) return (permissions: Permission[]) => false;

    return (permissions: Permission[]): boolean => {
      return permissions.some(permission => effectivePermissions.includes(permission));
    };
  }, [user, effectivePermissions]);

  const canAll = useMemo(() => {
    if (!user) return (permissions: Permission[]) => false;

    return (permissions: Permission[]): boolean => {
      return permissions.every(permission => effectivePermissions.includes(permission));
    };
  }, [user, effectivePermissions]);

  const isRole = useMemo(() => {
    if (!user) return (role: UserRole) => false;
    
    return (role: UserRole): boolean => {
      return user.role === role;
    };
  }, [user]);

  const isDriver = useMemo(() => user?.role === 'DRIVER', [user]);
  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);
  const isManager = useMemo(() => user?.role === 'MANAGER', [user]);

  return {
    can,
    canAny,
    canAll,
    isRole,
    isDriver,
    isAdmin,
    isManager,
  };
};
