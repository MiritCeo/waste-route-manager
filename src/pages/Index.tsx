import { useState, useCallback } from 'react';
import { Route, Address, WasteCategory } from '@/types/waste';
import { mockRoutes } from '@/data/mockData';
import { LoginPage } from './LoginPage';
import { RouteSelection } from './RouteSelection';
import { AddressList } from './AddressList';
import { CollectionView } from './CollectionView';
import { DailySummary } from './DailySummary';

type View = 'login' | 'routes' | 'addresses' | 'collection' | 'summary';

const Index = () => {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [currentView, setCurrentView] = useState<View>('login');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');

  const handleLogin = useCallback((id: string) => {
    setEmployeeId(id);
    setCurrentView('routes');
  }, []);

  const handleLogout = useCallback(() => {
    setEmployeeId('');
    setCurrentView('login');
    setSelectedRoute(null);
    setSelectedAddress(null);
  }, []);

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

  const handleOpenSummary = useCallback(() => {
    setCurrentView('summary');
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
  if (currentView === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentView === 'summary') {
    return (
      <DailySummary
        routes={routes}
        employeeId={employeeId}
        onLogout={handleLogout}
        onBack={handleBackToRoutes}
      />
    );
  }

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
      onOpenSummary={handleOpenSummary}
      employeeId={employeeId}
    />
  );
};

export default Index;
