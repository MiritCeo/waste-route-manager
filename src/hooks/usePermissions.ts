import { useMemo } from 'react';
import { Permission, UserRole } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const userPermissions = user?.permissions ?? [];

  const can = useMemo(() => {
    if (!user) return (permission: Permission) => false;

    return (permission: Permission): boolean => {
      return userPermissions.includes(permission);
    };
  }, [user, userPermissions]);

  const canAny = useMemo(() => {
    if (!user) return (permissions: Permission[]) => false;

    return (permissions: Permission[]): boolean => {
      return permissions.some(permission => userPermissions.includes(permission));
    };
  }, [user, userPermissions]);

  const canAll = useMemo(() => {
    if (!user) return (permissions: Permission[]) => false;

    return (permissions: Permission[]): boolean => {
      return permissions.every(permission => userPermissions.includes(permission));
    };
  }, [user, userPermissions]);

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
