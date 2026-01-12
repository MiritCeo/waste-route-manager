import { Route } from '@/types/waste';
import { RouteCard } from '@/components/RouteCard';
import { Header } from '@/components/Header';
import { Truck, BarChart3 } from 'lucide-react';
import logo from '@/assets/kompaktowy-pleszew-logo.png';

interface RouteSelectionProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
  onOpenSummary: () => void;
  employeeId: string;
}

export const RouteSelection = ({ routes, onSelectRoute, onOpenSummary, employeeId }: RouteSelectionProps) => {
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
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenSummary}
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <BarChart3 className="w-6 h-6 text-primary" />
            </button>
          </div>
        }
      />

      {/* Employee badge */}
      <div className="px-4 pb-2">
        <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
          <img src={logo} alt="Kompaktowy Pleszew" className="h-8 object-contain" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Zalogowany jako</p>
            <p className="font-medium text-foreground">Pracownik #{employeeId}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

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
