import { Route } from '@/types/waste';
import { RouteCard } from '@/components/RouteCard';
import { Header } from '@/components/Header';
import { Truck } from 'lucide-react';

interface RouteSelectionProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
}

export const RouteSelection = ({ routes, onSelectRoute }: RouteSelectionProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Wybierz trasę" 
        subtitle={new Date().toLocaleDateString('pl-PL', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
        rightElement={
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>
        }
      />

      <main className="p-4 pb-8 space-y-3">
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            onClick={() => onSelectRoute(route)}
          />
        ))}
      </main>
    </div>
  );
};
