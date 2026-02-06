import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Route,
  Address,
  WasteCategory,
  WasteType,
  AddressStatus,
  AddressIssueReason,
  AddressIssueFlag,
} from '@/types/waste';
import { routesService } from '@/api/services/routes.service';
import { toast } from 'sonner';
import { cacheManager, storage } from '@/utils/storage';
import { APP_CONFIG } from '@/constants/config';
import { useAuth } from './AuthContext';

interface RouteContextType {
  routes: Route[];
  isLoading: boolean;
  error: string | null;
  selectedRoute: Route | null;
  selectedWasteTypes: WasteType[];
  syncQueueCount: number;
  hasCollectionDraft: (routeId: string, addressId: string) => boolean;
  getCollectionDraft: (routeId: string, addressId: string) => CollectionDraft | null;
  saveCollectionDraft: (draft: CollectionDraft) => void;
  clearCollectionDraft: (routeId: string, addressId: string) => void;
  fetchRoutes: () => Promise<void>;
  getRouteById: (id: string, options?: { force?: boolean }) => Promise<Route | undefined>;
  updateAddressCollection: (
    routeId: string,
    addressId: string,
    waste: WasteCategory[],
    details?: CollectionDetails
  ) => Promise<void>;
  setSelectedRoute: (route: Route | null) => void;
  setSelectedWasteTypes: (types: WasteType[]) => void;
  refreshRoute: (routeId: string) => Promise<void>;
}

interface CollectionDetails {
  status?: AddressStatus;
  issueReason?: AddressIssueReason;
  issueFlags?: AddressIssueFlag[];
  issueNote?: string;
  issuePhoto?: string;
  issuePhotoFile?: File;
}

interface CollectionDraft extends CollectionDetails {
  routeId: string;
  addressId: string;
  waste: WasteCategory[];
  updatedAt: string;
}

type SyncOperation = {
  type: 'UPDATE_ADDRESS';
  routeId: string;
  addressId: string;
  payload: {
    waste: WasteCategory[];
    details?: CollectionDetails;
  };
  queuedAt: string;
};

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedWasteTypes, setSelectedWasteTypesState] = useState<WasteType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const pendingUpdatesRef = React.useRef<
    Map<
      string,
      {
        routeId: string;
        addressId: string;
        update: {
          waste: WasteCategory[];
          status: AddressStatus;
          issueReason?: AddressIssueReason;
          issueFlags?: AddressIssueFlag[];
          issueNote?: string;
          issuePhoto?: string;
        };
      }
    >
  >(new Map());
  const flushTimerRef = React.useRef<number | null>(null);

  const getSyncQueue = () => cacheManager.getSyncQueue<SyncOperation>();

  const saveSyncQueue = (queue: SyncOperation[]) => {
    storage.set(APP_CONFIG.STORAGE.SYNC_QUEUE_KEY, queue);
    setSyncQueueCount(queue.length);
  };

  const refreshSyncQueueCount = () => {
    setSyncQueueCount(getSyncQueue().length);
  };

  const processSyncQueue = async () => {
    if (!isAuthenticated) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const queue = getSyncQueue();
    if (!queue.length) return;

    const remaining: SyncOperation[] = [];
    for (const op of queue) {
      if (op.type !== 'UPDATE_ADDRESS') {
        remaining.push(op);
        continue;
      }
      try {
        const updated = await routesService.updateAddressCollection(
          op.routeId,
          op.addressId,
          op.payload.waste,
          op.payload.details
        );
        const resolvedStatus = (updated.status ?? op.payload.details?.status ?? 'COLLECTED') as AddressStatus;
        applyAddressUpdate(op.routeId, op.addressId, {
          waste: updated.waste ?? op.payload.waste,
          status: resolvedStatus,
          issueReason: updated.issueReason ?? op.payload.details?.issueReason,
          issueFlags: updated.issueFlags ?? op.payload.details?.issueFlags,
          issueNote: updated.issueNote ?? op.payload.details?.issueNote,
          issuePhoto: updated.issuePhoto ?? op.payload.details?.issuePhoto,
        });
      } catch {
        remaining.push(op);
      }
    }

    if (remaining.length !== queue.length) {
      saveSyncQueue(remaining);
      if (queue.length && remaining.length === 0) {
        toast.success('Synchronizacja zakończona', {
          description: 'Zapisane offline odbiory zostały wysłane',
        });
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setRoutes([]);
      setSelectedRoute(null);
      setIsLoading(false);
      setError(null);
      setSyncQueueCount(0);
      return;
    }

    refreshSyncQueueCount();
    fetchRoutes();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    processSyncQueue();
    const handleOnline = () => {
      processSyncQueue();
      fetchRoutes();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const stored = storage.get<{ date: string; types: WasteType[] }>(
      APP_CONFIG.STORAGE.WASTE_SELECTION_KEY
    );
    if (!stored) return;

    const today = new Date().toISOString().split('T')[0];
    if (stored.date === today) {
      setSelectedWasteTypesState(stored.types);
    } else {
      storage.remove(APP_CONFIG.STORAGE.WASTE_SELECTION_KEY);
    }
  }, []);

  const fetchRoutes = async () => {
    try {
      if (!isAuthenticated) {
        setRoutes([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      const data = await routesService.getRoutes();
      setRoutes(data);
      cacheManager.saveRoutes(data);
    } catch (err: any) {
      const message = err?.message || 'Nie udało się pobrać tras';
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const cached = APP_CONFIG.FEATURES.OFFLINE_MODE ? cacheManager.getRoutes<Route[]>() : null;
      if (isOffline && cached && cached.length > 0) {
        setRoutes(cached);
        setError(null);
        toast.success('Tryb offline', {
          description: 'Wczytano zapisane trasy z pamięci urządzenia',
        });
      } else {
        setError(message);
        toast.error('Błąd', {
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRouteById = async (
    id: string,
    options?: { force?: boolean }
  ): Promise<Route | undefined> => {
    try {
      if (!options?.force) {
        // First check if we have it in state
        const existingRoute = routes.find(r => r.id === id);
        if (existingRoute) {
          return existingRoute;
        }
      }

      // Otherwise fetch from API
      const route = await routesService.getRouteById(id);
      return route;
    } catch (err: any) {
      const message = err?.message || 'Nie udało się pobrać trasy';
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const cached = APP_CONFIG.FEATURES.OFFLINE_MODE ? cacheManager.getRoutes<Route[]>() : null;
      const cachedRoute = cached?.find(route => route.id === id);
      if (isOffline && cachedRoute) {
        return cachedRoute;
      }
      toast.error('Błąd', {
        description: message,
      });
      return undefined;
    }
  };

  const refreshRoute = async (routeId: string) => {
    try {
      const updatedRoute = await routesService.getRouteById(routeId);
      
      setRoutes(prev =>
        {
          const nextRoutes = prev.map(route => (route.id === routeId ? updatedRoute : route));
          cacheManager.saveRoutes(nextRoutes);
          return nextRoutes;
        }
      );

      if (selectedRoute?.id === routeId) {
        setSelectedRoute(updatedRoute);
      }
    } catch (err: any) {
      console.error('Failed to refresh route:', err);
    }
  };

  const flushAddressUpdates = () => {
    const updates = Array.from(pendingUpdatesRef.current.values());
    if (updates.length === 0) return;
    pendingUpdatesRef.current.clear();
    const updatesByRoute = new Map<string, typeof updates>();
    updates.forEach(update => {
      if (!updatesByRoute.has(update.routeId)) {
        updatesByRoute.set(update.routeId, []);
      }
      updatesByRoute.get(update.routeId)?.push(update);
    });

    setRoutes(prevRoutes => {
      const nextRoutes = prevRoutes.map(route => {
        const routeUpdates = updatesByRoute.get(route.id);
        if (!routeUpdates) return route;
        const updateMap = new Map(
          routeUpdates.map(item => [item.addressId, item.update])
        );
        const updatedAddresses = route.addresses.map(addr => {
          const update = updateMap.get(addr.id);
          if (!update) return addr;
          return {
            ...addr,
            waste: update.waste,
            status: update.status,
            isCollected: update.status === 'COLLECTED',
            issueReason: update.issueReason ?? undefined,
            issueFlags: update.issueFlags ?? [],
            issueNote: update.issueNote ?? undefined,
            issuePhoto: update.issuePhoto ?? undefined,
          };
        });
        const collectedCount = updatedAddresses.filter(a => a.isCollected).length;
        return {
          ...route,
          addresses: updatedAddresses,
          collectedAddresses: collectedCount,
        };
      });
      cacheManager.saveRoutes(nextRoutes);
      return nextRoutes;
    });

    setSelectedRoute(prev => {
      if (!prev) return prev;
      const routeUpdates = updatesByRoute.get(prev.id);
      if (!routeUpdates) return prev;
      const updateMap = new Map(routeUpdates.map(item => [item.addressId, item.update]));
      const updatedAddresses = prev.addresses.map(addr => {
        const update = updateMap.get(addr.id);
        if (!update) return addr;
        return {
          ...addr,
          waste: update.waste,
          status: update.status,
          isCollected: update.status === 'COLLECTED',
          issueReason: update.issueReason ?? undefined,
          issueFlags: update.issueFlags ?? [],
          issueNote: update.issueNote ?? undefined,
          issuePhoto: update.issuePhoto ?? undefined,
        };
      });
      return {
        ...prev,
        addresses: updatedAddresses,
        collectedAddresses: updatedAddresses.filter(a => a.isCollected).length,
      };
    });
  };

  const scheduleFlush = () => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flushAddressUpdates();
    }, 80);
  };

  const applyAddressUpdate = (
    routeId: string,
    addressId: string,
    update: {
      waste: WasteCategory[];
      status: AddressStatus;
      issueReason?: AddressIssueReason;
      issueFlags?: AddressIssueFlag[];
      issueNote?: string;
      issuePhoto?: string;
    }
  ) => {
    const key = `${routeId}:${addressId}`;
    pendingUpdatesRef.current.set(key, { routeId, addressId, update });
    scheduleFlush();
  };

  const updateAddressCollection = async (
    routeId: string,
    addressId: string,
    waste: WasteCategory[],
    details?: CollectionDetails
  ) => {
    try {
      // Update via API
      const updatedAddress = await routesService.updateAddressCollection(routeId, addressId, waste, details);

      // Update local state
      const resolvedStatus = (updatedAddress.status ?? details?.status ?? 'COLLECTED') as AddressStatus;
      applyAddressUpdate(routeId, addressId, {
        waste: updatedAddress.waste ?? waste,
        status: resolvedStatus,
        issueReason: updatedAddress.issueReason ?? details?.issueReason,
        issueFlags: updatedAddress.issueFlags ?? details?.issueFlags,
        issueNote: updatedAddress.issueNote ?? details?.issueNote,
        issuePhoto: updatedAddress.issuePhoto ?? details?.issuePhoto,
      });

      clearCollectionDraft(routeId, addressId);

      const totalCount = waste.reduce((sum, w) => sum + w.count, 0);
      toast.success('Odbiór zapisany!', {
        description: `Zapisano ${totalCount} pojemników`,
      });
    } catch (err: any) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (APP_CONFIG.FEATURES.OFFLINE_MODE && isOffline) {
        const resolvedStatus = (details?.status ?? 'COLLECTED') as AddressStatus;
        applyAddressUpdate(routeId, addressId, {
          waste,
          status: resolvedStatus,
          issueReason: details?.issueReason,
          issueFlags: details?.issueFlags,
          issueNote: details?.issueNote,
          issuePhoto: details?.issuePhoto,
        });

        const queue = getSyncQueue();
        queue.push({
          type: 'UPDATE_ADDRESS',
          routeId,
          addressId,
          payload: { waste, details },
          queuedAt: new Date().toISOString(),
        });
        saveSyncQueue(queue);

        clearCollectionDraft(routeId, addressId);

        const totalCount = waste.reduce((sum, w) => sum + w.count, 0);
        toast.success('Zapisano offline', {
          description: `Zapisano ${totalCount} pojemników. Dane zostaną zsynchronizowane po powrocie internetu.`,
        });
        return;
      }

      const message = err?.message || 'Nie udało się zapisać odbioru';
      toast.error('Błąd', {
        description: message,
      });
      throw err;
    }
  };

  const getDraftsMap = () =>
    storage.get<Record<string, CollectionDraft>>(APP_CONFIG.STORAGE.COLLECTION_DRAFTS_KEY, {}) || {};

  const saveDraftsMap = (drafts: Record<string, CollectionDraft>) => {
    storage.set(APP_CONFIG.STORAGE.COLLECTION_DRAFTS_KEY, drafts);
  };

  const makeDraftKey = (routeId: string, addressId: string) => `${routeId}:${addressId}`;

  const getLocalDateString = (value?: Date) => {
    const date = value ?? new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDraftDate = (updatedAt?: string) => {
    if (!updatedAt) return '';
    const parsed = new Date(updatedAt);
    if (Number.isNaN(parsed.getTime())) return '';
    return getLocalDateString(parsed);
  };

  const isDraftCurrent = (draft: CollectionDraft) =>
    getDraftDate(draft.updatedAt) === getLocalDateString();

  const getCollectionDraft = (routeId: string, addressId: string): CollectionDraft | null => {
    const drafts = getDraftsMap();
    const key = makeDraftKey(routeId, addressId);
    const draft = drafts[key];
    if (!draft) return null;
    if (!isDraftCurrent(draft)) {
      delete drafts[key];
      saveDraftsMap(drafts);
      return null;
    }
    return draft;
  };

  const hasCollectionDraft = (routeId: string, addressId: string): boolean =>
    Boolean(getCollectionDraft(routeId, addressId));

  const saveCollectionDraft = (draft: CollectionDraft) => {
    const drafts = getDraftsMap();
    drafts[makeDraftKey(draft.routeId, draft.addressId)] = draft;
    saveDraftsMap(drafts);
  };

  const clearCollectionDraft = (routeId: string, addressId: string) => {
    const drafts = getDraftsMap();
    const key = makeDraftKey(routeId, addressId);
    if (drafts[key]) {
      delete drafts[key];
      saveDraftsMap(drafts);
    }
  };

  const setSelectedWasteTypes = (types: WasteType[]) => {
    setSelectedWasteTypesState(types);
    if (types.length === 0) {
      storage.remove(APP_CONFIG.STORAGE.WASTE_SELECTION_KEY);
      return;
    }

    storage.set(APP_CONFIG.STORAGE.WASTE_SELECTION_KEY, {
      date: new Date().toISOString().split('T')[0],
      types,
    });
  };

  const value: RouteContextType = {
    routes,
    isLoading,
    error,
    selectedRoute,
    selectedWasteTypes,
    syncQueueCount,
    hasCollectionDraft,
    getCollectionDraft,
    saveCollectionDraft,
    clearCollectionDraft,
    fetchRoutes,
    getRouteById,
    updateAddressCollection,
    setSelectedRoute,
    setSelectedWasteTypes,
    refreshRoute,
  };

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
};

export const useRoutes = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoutes must be used within a RouteProvider');
  }
  return context;
};
