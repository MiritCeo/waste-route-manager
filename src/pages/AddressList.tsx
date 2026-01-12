import { useState, useMemo } from 'react';
import { Route, Address } from '@/types/waste';
import { AddressCard } from '@/components/AddressCard';
import { ProgressBar } from '@/components/ProgressBar';
import { FilterTabs, FilterType } from '@/components/FilterTabs';
import { Header } from '@/components/Header';

interface AddressListProps {
  route: Route;
  onBack: () => void;
  onSelectAddress: (address: Address) => void;
}

export const AddressList = ({ route, onBack, onSelectAddress }: AddressListProps) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const counts = useMemo(() => ({
    all: route.addresses.length,
    pending: route.addresses.filter(a => !a.isCollected).length,
    collected: route.addresses.filter(a => a.isCollected).length,
  }), [route.addresses]);

  const filteredAddresses = useMemo(() => {
    switch (filter) {
      case 'pending':
        return route.addresses.filter(a => !a.isCollected);
      case 'collected':
        return route.addresses.filter(a => a.isCollected);
      default:
        return route.addresses;
    }
  }, [route.addresses, filter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={route.name}
        subtitle={`${route.addresses.length} adresów`}
        onBack={onBack}
      />

      <div className="px-4 py-3 space-y-4 bg-background sticky top-[73px] z-40 border-b border-border">
        <ProgressBar
          current={counts.collected}
          total={counts.all}
        />
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
               'Brak adresów'}
            </p>
          </div>
        ) : (
          filteredAddresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onClick={() => onSelectAddress(address)}
            />
          ))
        )}
      </main>
    </div>
  );
};
