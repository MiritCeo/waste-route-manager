import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Address } from '@/types/waste';
import { AddressCard } from '@/components/AddressCard';
import { ProgressBar } from '@/components/ProgressBar';
import { FilterTabs, FilterType } from '@/components/FilterTabs';
import { Header } from '@/components/Header';
import { useRoutes } from '@/contexts/RouteContext';
import { AddressStatus } from '@/types/waste';
import { ROUTES } from '@/constants/routes';
import { WASTE_OPTIONS } from '@/constants/waste';
import { toast } from 'sonner';
import { CloudOff } from 'lucide-react';

export const AddressList = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    routes,
    selectedRoute,
    setSelectedRoute,
    getRouteById,
    selectedWasteTypes,
    hasCollectionDraft,
    syncQueueCount,
  } = useRoutes();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const isRestoringRef = useRef(false);
  const pendingRestoreIdRef = useRef<string | null>(null);
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const restoreHandledRef = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const [rowHeight, setRowHeight] = useState(112);
  const OVERSCAN = 6;

  const scrollStorageKey = useMemo(() => {
    if (!routeId) return '';
    return `driver.route.scroll.${routeId}.${filter}`;
  }, [routeId, filter]);

  const filterStorageKey = useMemo(() => {
    if (!routeId) return '';
    return `driver.route.filter.${routeId}`;
  }, [routeId]);

  const returnStorageKey = useMemo(() => {
    if (!routeId) return '';
    return `driver.route.return.${routeId}`;
  }, [routeId]);

  const lastAddressKey = useMemo(() => {
    if (!routeId) return '';
    return `driver.route.lastAddress.${routeId}`;
  }, [routeId]);

  const desiredScrollKey = useMemo(() => {
    if (!routeId) return '';
    return `driver.route.desiredScroll.${routeId}`;
  }, [routeId]);

  // Calculate counts - MUST be before any conditional returns
  const counts = useMemo(() => {
    if (!selectedRoute) {
      return { all: 0, pending: 0, collected: 0, deferred: 0, issues: 0 };
    }

    const getStatus = (address: Address): AddressStatus => {
      if (address.status === 'ISSUE' || address.status === 'DEFERRED') return address.status;
      if (selectedWasteTypes.length > 0) {
        const collected = address.collectedWasteTypes || [];
        const isCollected = selectedWasteTypes.every(type => collected.includes(type));
        return isCollected ? 'COLLECTED' : 'PENDING';
      }
      return address.status ?? (address.isCollected ? 'COLLECTED' : 'PENDING');
    };

    const statuses = selectedRoute.addresses.map(getStatus);

    return {
      all: selectedRoute.addresses.length,
      pending: statuses.filter(status => status === 'PENDING').length,
      collected: statuses.filter(status => status === 'COLLECTED').length,
      deferred: statuses.filter(status => status === 'DEFERRED').length,
      issues: statuses.filter(status => status === 'ISSUE').length,
    };
  }, [selectedRoute]);

  // Filter addresses - MUST be before any conditional returns
  const filteredAddresses = useMemo(() => {
    if (!selectedRoute) return [];
    const getStatus = (address: Address): AddressStatus => {
      if (address.status === 'ISSUE' || address.status === 'DEFERRED') return address.status;
      if (selectedWasteTypes.length > 0) {
        const collected = address.collectedWasteTypes || [];
        const isCollected = selectedWasteTypes.every(type => collected.includes(type));
        return isCollected ? 'COLLECTED' : 'PENDING';
      }
      return address.status ?? (address.isCollected ? 'COLLECTED' : 'PENDING');
    };

    switch (filter) {
      case 'pending':
        return selectedRoute.addresses.filter(a => getStatus(a) === 'PENDING');
      case 'collected':
        return selectedRoute.addresses.filter(a => getStatus(a) === 'COLLECTED');
      case 'deferred':
        return selectedRoute.addresses.filter(a => getStatus(a) === 'DEFERRED');
      case 'issues':
        return selectedRoute.addresses.filter(a => getStatus(a) === 'ISSUE');
      default:
        return selectedRoute.addresses;
    }
  }, [selectedRoute, filter, selectedWasteTypes]);

  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;
    const current = listRef.current;
    if (!current) return;
    const top = current.scrollTop;
    if (scrollStorageKey) {
      sessionStorage.setItem(scrollStorageKey, String(top));
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(top);
    });
  }, [scrollStorageKey]);

  const saveScrollPosition = useCallback(() => {
    if (!scrollStorageKey) return;
    const current = listRef.current;
    if (!current) return;
    sessionStorage.setItem(scrollStorageKey, String(current.scrollTop));
  }, [scrollStorageKey]);

  // Load route on mount
  useEffect(() => {
    const loadRoute = async () => {
      if (selectedWasteTypes.length === 0) {
        toast.error('Wybierz rodzaj odpadów na dziś');
        navigate(ROUTES.DRIVER.ROUTES);
        return;
      }

      if (!routeId) {
        navigate(ROUTES.DRIVER.ROUTES);
        return;
      }

      // Check if we already have this route selected
      if (selectedRoute?.id === routeId) {
        setIsLoading(false);
        return;
      }

      // Check in routes list
      const route = routes.find(r => r.id === routeId);
      if (route) {
        setSelectedRoute(route);
        if (route.totalAddresses > route.addresses.length) {
          const refreshed = await getRouteById(routeId, { force: true, summary: true });
          if (refreshed) {
            setSelectedRoute(refreshed);
          }
        }
        setIsLoading(false);
        return;
      }

      // Otherwise fetch from API
      const fetchedRoute = await getRouteById(routeId, { force: true, summary: true });
      if (fetchedRoute) {
        setSelectedRoute(fetchedRoute);
      } else {
        navigate(ROUTES.DRIVER.ROUTES);
      }
      setIsLoading(false);
    };

    loadRoute();
    return () => {
      saveScrollPosition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]); // Only re-run when routeId changes

  useEffect(() => {
    if (location.state && (location.state as { resetFilter?: boolean }).resetFilter) {
      setFilter('all');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!location.state) return;
    const state = location.state as { restoreAddressId?: string };
    if (!state.restoreAddressId) return;
    pendingRestoreIdRef.current = state.restoreAddressId;
    setRestoreTargetId(state.restoreAddressId);
    restoreHandledRef.current = false;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  useEffect(() => {
    if (!filterStorageKey) return;
    const stored = sessionStorage.getItem(filterStorageKey);
    if (!stored) return;
    const allowed: FilterType[] = ['all', 'pending', 'collected', 'deferred', 'issues'];
    if (allowed.includes(stored as FilterType)) {
      setFilter(stored as FilterType);
    }
  }, [filterStorageKey]);

  useEffect(() => {
    if (!filterStorageKey) return;
    sessionStorage.setItem(filterStorageKey, filter);
  }, [filterStorageKey, filter]);

  useLayoutEffect(() => {
    if (!scrollStorageKey) return;
    isRestoringRef.current = true;

    const getDesiredScroll = () => {
      if (pendingRestoreIdRef.current) {
        const pendingId = pendingRestoreIdRef.current;
        const index = filteredAddresses.findIndex(item => item.id === pendingId);
        if (index !== -1) {
          pendingRestoreIdRef.current = null;
          return index * rowHeight;
        }
      }
      if (desiredScrollKey) {
        const desiredRaw = sessionStorage.getItem(desiredScrollKey);
        if (desiredRaw) {
          const desiredValue = Number(desiredRaw);
          if (!Number.isNaN(desiredValue)) {
            sessionStorage.removeItem(desiredScrollKey);
            return desiredValue;
          }
        }
      }
      const shouldReturn = returnStorageKey && sessionStorage.getItem(returnStorageKey);
      if (shouldReturn && lastAddressKey) {
        const lastAddressId = sessionStorage.getItem(lastAddressKey);
        if (lastAddressId) {
          const index = filteredAddresses.findIndex(item => item.id === lastAddressId);
          if (index !== -1) {
            return index * rowHeight;
          }
        }
        sessionStorage.removeItem(returnStorageKey);
      }

      const stored = sessionStorage.getItem(scrollStorageKey);
      if (!stored) return null;
      const value = Number(stored);
      if (Number.isNaN(value)) return null;
      return value;
    };

    const desired = getDesiredScroll();
    if (desired === null) {
      isRestoringRef.current = false;
      return;
    }

    let attempts = 0;
    const tryRestore = () => {
      const target = listRef.current;
      if (!target) return;

      // Wait until layout is ready (scrollHeight reflects full list)
      if (target.scrollHeight <= target.clientHeight && attempts < 8) {
        attempts += 1;
        setTimeout(tryRestore, 60);
        return;
      }

      const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight);
      const clamped = Math.min(Math.max(desired, 0), maxScroll);
      isRestoringRef.current = true;
      target.scrollTop = clamped;
      setScrollTop(clamped);
      requestAnimationFrame(() => {
        if (target.scrollTop !== clamped && attempts < 8) {
          attempts += 1;
          setTimeout(tryRestore, 60);
          return;
        }
        isRestoringRef.current = false;
      });
    };

    tryRestore();
  }, [scrollStorageKey, returnStorageKey, lastAddressKey, filteredAddresses, rowHeight, viewportHeight]);

  useEffect(() => {
    const target = listRef.current;
    if (!target) return;
    const updateHeight = () => {
      setViewportHeight(target.clientHeight);
    };
    updateHeight();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredAddresses.length]);

  useLayoutEffect(() => {
    const target = listRef.current;
    if (!target) return;
    const height = target.clientHeight || window.innerHeight;
    if (height && viewportHeight !== height) {
      setViewportHeight(height);
    }
  }, [isLoading, filteredAddresses.length, viewportHeight]);

  useEffect(() => {
    const updateRowHeight = () => {
      const width = window.innerWidth;
      if (width <= 360) {
        setRowHeight(132);
      } else if (width <= 768) {
        setRowHeight(118);
      } else {
        setRowHeight(108);
      }
    };
    updateRowHeight();
    window.addEventListener('resize', updateRowHeight);
    return () => window.removeEventListener('resize', updateRowHeight);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    navigate(ROUTES.DRIVER.ROUTES);
  };

  const handleSelectAddress = useCallback(
    (addressId: string) => {
      saveScrollPosition();
      if (lastAddressKey) {
        sessionStorage.setItem(lastAddressKey, addressId);
      }
      if (desiredScrollKey) {
        const index = filteredAddresses.findIndex(item => item.id === addressId);
        if (index !== -1) {
          sessionStorage.setItem(desiredScrollKey, String(index * rowHeight));
        }
      }
      if (returnStorageKey) {
        sessionStorage.setItem(returnStorageKey, '1');
      }
      navigate(`/driver/collect/${routeId}/${addressId}`);
    },
    [navigate, routeId, saveScrollPosition, lastAddressKey, returnStorageKey, desiredScrollKey, filteredAddresses, rowHeight]
  );


  // NOW we can do conditional rendering
  if (isLoading || !selectedRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie adresów...</p>
        </div>
      </div>
    );
  }

  const useVirtualization = viewportHeight > 0 && !restoreTargetId;
  const totalHeight = useVirtualization ? filteredAddresses.length * rowHeight : 0;
  const startIndex = useVirtualization
    ? Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
    : 0;
  const endIndex = useVirtualization
    ? Math.min(
        filteredAddresses.length - 1,
        Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN
      )
    : filteredAddresses.length - 1;
  const visibleItems = filteredAddresses.slice(startIndex, endIndex + 1);
  const offsetTop = useVirtualization ? startIndex * rowHeight : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={selectedRoute.name}
        subtitle={`${selectedRoute.addresses.length} adresów`}
        onBack={handleBack}
        rightElement={
          syncQueueCount > 0 ? (
            <div className="px-3 py-1 rounded-full border border-warning/30 bg-warning/10 text-warning text-xs font-semibold flex items-center gap-2">
              <CloudOff className="w-4 h-4" />
              {syncQueueCount}
            </div>
          ) : undefined
        }
      />

      <div className="px-4 py-3 space-y-4 bg-background sticky top-[73px] z-40 border-b border-border">
        <ProgressBar
          current={counts.collected}
          total={counts.all}
        />
        {selectedWasteTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedWasteTypes.map(type => {
              const option = WASTE_OPTIONS.find(item => item.id === type);
              return (
                <span
                  key={type}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/40 text-muted-foreground"
                >
                  {option?.icon} {option?.name || type}
                </span>
              );
            })}
          </div>
        )}
        <FilterTabs
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
      </div>

      <main className="flex-1 p-4 pb-8 overflow-auto" ref={listRef} onScroll={handleScroll}>
        {filteredAddresses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {filter === 'pending' ? 'Brak adresów do odbioru' :
               filter === 'collected' ? 'Brak odebranych adresów' :
               filter === 'deferred' ? 'Brak odłożonych adresów' :
               filter === 'issues' ? 'Brak adresów z problemami' :
               'Brak adresów'}
            </p>
          </div>
        ) : useVirtualization ? (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetTop}px)` }}>
              {visibleItems.map((address) => {
                const collected = address.collectedWasteTypes || [];
                const computedCollected =
                  selectedWasteTypes.length > 0
                    ? selectedWasteTypes.every(type => collected.includes(type))
                    : address.isCollected;
                const computedStatus =
                  address.status === 'ISSUE' || address.status === 'DEFERRED'
                    ? address.status
                    : computedCollected
                      ? 'COLLECTED'
                      : 'PENDING';
                const addressForView = {
                  ...address,
                  status: computedStatus,
                  isCollected: computedCollected,
                };
                return (
                  <div key={address.id} style={{ height: rowHeight }} className="pb-2 last:pb-0">
                    <AddressCard
                      address={addressForView}
                      hasDraft={routeId ? hasCollectionDraft(routeId, address.id) : false}
                      onSelect={handleSelectAddress}
                      className="h-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          filteredAddresses.map((address) => {
            const collected = address.collectedWasteTypes || [];
            const computedCollected =
              selectedWasteTypes.length > 0
                ? selectedWasteTypes.every(type => collected.includes(type))
                : address.isCollected;
            const computedStatus =
              address.status === 'ISSUE' || address.status === 'DEFERRED'
                ? address.status
                : computedCollected
                  ? 'COLLECTED'
                  : 'PENDING';
            const addressForView = {
              ...address,
              status: computedStatus,
              isCollected: computedCollected,
            };
            return (
              <div
                key={address.id}
                className="pb-2 last:pb-0"
                ref={(el) => {
                  if (!el || !restoreTargetId || restoreHandledRef.current) return;
                  if (address.id !== restoreTargetId) return;
                  restoreHandledRef.current = true;
                  el.scrollIntoView({ block: 'center', behavior: 'auto' });
                  requestAnimationFrame(() => setRestoreTargetId(null));
                }}
              >
                <AddressCard
                  address={addressForView}
                  hasDraft={routeId ? hasCollectionDraft(routeId, address.id) : false}
                  onSelect={handleSelectAddress}
                />
              </div>
            );
          })
        )
        }
      </main>
    </div>
  );
};
