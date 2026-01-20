import { Permission } from '@/types/user';

export const ALL_PERMISSIONS: Permission[] = [
  'VIEW_ROUTES',
  'COLLECT_WASTE',
  'MANAGE_ROUTES',
  'MANAGE_ADDRESSES',
  'MANAGE_USERS',
  'VIEW_STATISTICS',
  'MANAGE_SETTINGS',
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_ROUTES: 'Podgląd tras',
  COLLECT_WASTE: 'Odbiór odpadów',
  MANAGE_ROUTES: 'Zarządzanie trasami',
  MANAGE_ADDRESSES: 'Zarządzanie adresami',
  MANAGE_USERS: 'Zarządzanie użytkownikami',
  VIEW_STATISTICS: 'Podgląd statystyk',
  MANAGE_SETTINGS: 'Zarządzanie ustawieniami',
};
