export const APP_CONFIG = {
  APP_NAME: 'Waste Route Manager',
  COMPANY_NAME: 'Kompaktowy Pleszew',
  VERSION: '2.0.0',
  
  // API Configuration
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
  },

  // Auth Configuration
  AUTH: {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'auth_user',
    TOKEN_EXPIRY_HOURS: 8,
    PIN_MIN_LENGTH: 4,
    PIN_MAX_LENGTH: 6,
  },

  // Storage Configuration
  STORAGE: {
    ROUTES_KEY: 'cached_routes',
    SYNC_QUEUE_KEY: 'sync_queue',
    OFFLINE_DATA_KEY: 'offline_data',
    WASTE_SELECTION_KEY: 'driver_waste_selection',
    COLLECTION_DRAFTS_KEY: 'collection_drafts',
    MAX_CACHE_AGE_HOURS: 24,
  },

  // UI Configuration
  UI: {
    ITEMS_PER_PAGE: 20,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 150,
  },

  // Feature Flags
  FEATURES: {
    OFFLINE_MODE: true,
    DARK_MODE: true,
    NOTIFICATIONS: true,
    GEOLOCATION: false,
    REPORTS_EXPORT: true,
  },
} as const;

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
