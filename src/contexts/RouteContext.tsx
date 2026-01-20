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
import { storage } from '@/utils/storage';
import { APP_CONFIG } from '@/constants/config';

interface RouteContextType {
  routes: Route[];
  isLoading: boolean;
  error: string | null;
  selectedRoute: Route | null;
  selectedWasteTypes: WasteType[];
  hasCollectionDraft: (routeId: string, addressId: string) => boolean;
  getCollectionDraft: (routeId: string, addressId: string) => CollectionDraft | null;
  saveCollectionDraft: (draft: CollectionDraft) => void;
  clearCollectionDraft: (routeId: string, addressId: string) => void;
  fetchRoutes: () => Promise<void>;
  getRouteById: (id: string) => Promise<Route | undefined>;
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
  reportToAdmin?: boolean;
}

interface CollectionDraft extends CollectionDetails {
  routeId: string;
  addressId: string;
  waste: WasteCategory[];
  updatedAt: string;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedWasteTypes, setSelectedWasteTypesState] = useState<WasteType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

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
      setIsLoading(true);
      setError(null);

      const data = await routesService.getRoutes();
      setRoutes(data);
    } catch (err: any) {
      const message = err?.message || 'Nie udało się pobrać tras';
      setError(message);
      toast.error('Błąd', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRouteById = async (id: string): Promise<Route | undefined> => {
    try {
      // First check if we have it in state
      const existingRoute = routes.find(r => r.id === id);
      if (existingRoute) {
        return existingRoute;
      }

      // Otherwise fetch from API
      const route = await routesService.getRouteById(id);
      return route;
    } catch (err: any) {
      const message = err?.message || 'Nie udało się pobrać trasy';
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
        prev.map(route => (route.id === routeId ? updatedRoute : route))
      );

      if (selectedRoute?.id === routeId) {
        setSelectedRoute(updatedRoute);
      }
    } catch (err: any) {
      console.error('Failed to refresh route:', err);
    }
  };

  const updateAddressCollection = async (
    routeId: string,
    addressId: string,
    waste: WasteCategory[],
    details?: CollectionDetails
  ) => {
    try {
      // Update via API
      await routesService.updateAddressCollection(routeId, addressId, waste, details);

      // Update local state
      setRoutes(prevRoutes =>
        prevRoutes.map(route => {
          if (route.id !== routeId) return route;

          const updatedAddresses = route.addresses.map(addr => {
            if (addr.id !== addressId) return addr;
            return {
              ...addr,
              waste,
              status: details?.status ?? 'COLLECTED',
              isCollected: (details?.status ?? 'COLLECTED') === 'COLLECTED',
              issueReason: details?.issueReason,
              issueFlags: details?.issueFlags ?? addr.issueFlags,
              issueNote: details?.issueNote,
              issuePhoto: details?.issuePhoto,
              reportToAdmin: details?.reportToAdmin ?? addr.reportToAdmin,
            };
          });

          const collectedCount = updatedAddresses.filter(a => a.isCollected).length;

          return {
            ...route,
            addresses: updatedAddresses,
            collectedAddresses: collectedCount,
          };
        })
      );

      // Update selectedRoute if it's the current one
      if (selectedRoute?.id === routeId) {
        const updatedAddresses = selectedRoute.addresses.map(addr => {
          if (addr.id !== addressId) return addr;
          return {
            ...addr,
            waste,
            status: details?.status ?? 'COLLECTED',
            isCollected: (details?.status ?? 'COLLECTED') === 'COLLECTED',
            issueReason: details?.issueReason,
            issueFlags: details?.issueFlags ?? addr.issueFlags,
            issueNote: details?.issueNote,
            issuePhoto: details?.issuePhoto,
            reportToAdmin: details?.reportToAdmin ?? addr.reportToAdmin,
          };
        });

        setSelectedRoute({
          ...selectedRoute,
          addresses: updatedAddresses,
          collectedAddresses: updatedAddresses.filter(a => a.isCollected).length,
        });
      }

      clearCollectionDraft(routeId, addressId);

      const totalCount = waste.reduce((sum, w) => sum + w.count, 0);
      toast.success('Odbiór zapisany!', {
        description: `Zapisano ${totalCount} pojemników`,
      });
    } catch (err: any) {
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

  const hasCollectionDraft = (routeId: string, addressId: string): boolean => {
    const drafts = getDraftsMap();
    return Boolean(drafts[makeDraftKey(routeId, addressId)]);
  };

  const getCollectionDraft = (routeId: string, addressId: string): CollectionDraft | null => {
    const drafts = getDraftsMap();
    return drafts[makeDraftKey(routeId, addressId)] || null;
  };

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
