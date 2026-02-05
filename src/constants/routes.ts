export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',

  // Driver routes
  DRIVER: {
    ROOT: '/driver',
    ROUTES: '/driver/routes',
    ROUTE_DETAILS: '/driver/route/:id',
    COLLECTION: '/driver/collect/:addressId',
    SUMMARY: '/driver/summary',
  },

  // Admin routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    ROUTES: '/admin/routes',
    ADDRESSES: '/admin/addresses',
    ADDRESS_STATS: '/admin/addresses/:addressId/stats',
    ADDRESS_STATS_OVERVIEW: '/admin/addresses/stats',
    IMPORT: '/admin/import',
    EMPLOYEES: '/admin/employees',
    STATISTICS: '/admin/statistics',
    ISSUES: '/admin/issues',
    DAILY_STATS: '/admin/daily-stats',
    SETTINGS: '/admin/settings',
  },
} as const;

// Helper functions for dynamic routes
export const getRouteDetailsPath = (routeId: string) => 
  `/driver/route/${routeId}`;

export const getCollectionPath = (addressId: string) => 
  `/driver/collect/${addressId}`;

export const getAdminRoutePath = (routeId: string) => 
  `/admin/routes/${routeId}`;

export const getAdminAddressPath = (addressId: string) => 
  `/admin/addresses/${addressId}`;

export const getAdminAddressStatsPath = (addressId: string) =>
  `/admin/addresses/${addressId}/stats`;

export const getAdminEmployeePath = (userId: string) => 
  `/admin/employees/${userId}`;
