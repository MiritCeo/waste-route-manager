import { useState, useCallback } from 'react';
import { Route, Address, WasteCategory } from '@/types/waste';
import { mockRoutes } from '@/data/mockData';
import { RouteSelection } from './RouteSelection';
import { AddressList } from './AddressList';
import { CollectionView } from './CollectionView';

type View = 'routes' | 'addresses' | 'collection';

const Index = () => {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [currentView, setCurrentView] = useState<View>('routes');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleSelectRoute = useCallback((route: Route) => {
    setSelectedRoute(route);
    setCurrentView('addresses');
  }, []);

  const handleSelectAddress = useCallback((address: Address) => {
    setSelectedAddress(address);
    setCurrentView('collection');
  }, []);

  const handleBackToRoutes = useCallback(() => {
    setCurrentView('routes');
    setSelectedRoute(null);
    setSelectedAddress(null);
  }, []);

  const handleBackToAddresses = useCallback(() => {
    setCurrentView('addresses');
    setSelectedAddress(null);
  }, []);

  const handleSaveCollection = useCallback((updatedWaste: WasteCategory[]) => {
    if (!selectedRoute || !selectedAddress) return;

    // Update the address with new waste data and mark as collected
    setRoutes(prevRoutes =>
      prevRoutes.map(route => {
        if (route.id !== selectedRoute.id) return route;

        const updatedAddresses = route.addresses.map(addr => {
          if (addr.id !== selectedAddress.id) return addr;
          return { ...addr, waste: updatedWaste, isCollected: true };
        });

        const collectedCount = updatedAddresses.filter(a => a.isCollected).length;

        return {
          ...route,
          addresses: updatedAddresses,
          collectedAddresses: collectedCount,
        };
      })
    );

    // Update selectedRoute to reflect changes
    setSelectedRoute(prev => {
      if (!prev) return null;
      
      const updatedAddresses = prev.addresses.map(addr => {
        if (addr.id !== selectedAddress.id) return addr;
        return { ...addr, waste: updatedWaste, isCollected: true };
      });

      return {
        ...prev,
        addresses: updatedAddresses,
        collectedAddresses: updatedAddresses.filter(a => a.isCollected).length,
      };
    });

    // Go back to address list
    setCurrentView('addresses');
    setSelectedAddress(null);
  }, [selectedRoute, selectedAddress]);

  // Render current view
  if (currentView === 'collection' && selectedAddress && selectedRoute) {
    return (
      <CollectionView
        address={selectedAddress}
        onBack={handleBackToAddresses}
        onSave={handleSaveCollection}
      />
    );
  }

  if (currentView === 'addresses' && selectedRoute) {
    // Find the updated route from state
    const currentRoute = routes.find(r => r.id === selectedRoute.id) || selectedRoute;
    
    return (
      <AddressList
        route={currentRoute}
        onBack={handleBackToRoutes}
        onSelectAddress={handleSelectAddress}
      />
    );
  }

  return (
    <RouteSelection
      routes={routes}
      onSelectRoute={handleSelectRoute}
    />
  );
};

export default Index;
