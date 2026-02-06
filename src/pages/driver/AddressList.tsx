import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const [rowHeight, setRowHeight] = useState(112);
  const OVERSCAN = 6;

  const scrollStorageKey = useMemo(() => {
    if (!routeId) return '';
    return `driver.route.scroll.${routeId}.${filter}`;
  }, [routeId, filter]);

  // Calculate counts - MUST be before any conditional returns
  const counts = useMemo(() => {
    if (!selectedRoute) {
      return { all: 0, pending: 0, collected: 0, deferred: 0, issues: 0 };
    }

    const getStatus = (address: Address): AddressStatus =>
      address.status ?? (address.isCollected ? 'COLLECTED' : 'PENDING');

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
    const getStatus = (address: Address): AddressStatus =>
      address.status ?? (address.isCollected ? 'COLLECTED' : 'PENDING');

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
  }, [selectedRoute, filter]);

  const handleScroll = useCallback(() => {
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
          const refreshed = await getRouteById(routeId, { force: true });
          if (refreshed) {
            setSelectedRoute(refreshed);
          }
        }
        setIsLoading(false);
        return;
      }

      // Otherwise fetch from API
      const fetchedRoute = await getRouteById(routeId, { force: true });
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
    if (!scrollStorageKey) return;
    const stored = sessionStorage.getItem(scrollStorageKey);
    if (!stored) return;
    const target = listRef.current;
    if (!target) return;
    const value = Number(stored);
    if (Number.isNaN(value)) return;
    target.scrollTop = value;
    setScrollTop(value);
  }, [scrollStorageKey, filteredAddresses.length]);

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
      navigate(`/driver/collect/${routeId}/${addressId}`);
    },
    [navigate, routeId, saveScrollPosition]
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

  const totalHeight = filteredAddresses.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(
    filteredAddresses.length - 1,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN
  );
  const visibleItems = filteredAddresses.slice(startIndex, endIndex + 1);
  const offsetTop = startIndex * rowHeight;

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
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetTop}px)` }}>
              {visibleItems.map((address) => (
                <div key={address.id} style={{ height: rowHeight }} className="pb-2 last:pb-0">
                  <AddressCard
                    address={address}
                    hasDraft={routeId ? hasCollectionDraft(routeId, address.id) : false}
                    onSelect={handleSelectAddress}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
