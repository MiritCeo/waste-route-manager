import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export const AddressList = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const {
    routes,
    selectedRoute,
    setSelectedRoute,
    getRouteById,
    selectedWasteTypes,
    hasCollectionDraft,
  } = useRoutes();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
        return;
      }

      // Otherwise fetch from API
      const fetchedRoute = await getRouteById(routeId);
      if (fetchedRoute) {
        setSelectedRoute(fetchedRoute);
      } else {
        navigate(ROUTES.DRIVER.ROUTES);
      }
      setIsLoading(false);
    };

    loadRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]); // Only re-run when routeId changes

  const handleBack = () => {
    navigate(ROUTES.DRIVER.ROUTES);
  };

  const handleSelectAddress = (address: Address) => {
    navigate(`/driver/collect/${routeId}/${address.id}`);
  };


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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={selectedRoute.name}
        subtitle={`${selectedRoute.addresses.length} adresów`}
        onBack={handleBack}
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

      <main className="flex-1 p-4 space-y-3 pb-8">
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
          filteredAddresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              hasDraft={routeId ? hasCollectionDraft(routeId, address.id) : false}
              onClick={() => handleSelectAddress(address)}
            />
          ))
        )}
      </main>
    </div>
  );
};
