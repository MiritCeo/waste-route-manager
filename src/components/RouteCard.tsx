import { ChevronRight, MapPin } from 'lucide-react';
import { Route } from '@/types/waste';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route: Route;
  onClick: () => void;
}

export const RouteCard = ({ route, onClick }: RouteCardProps) => {
  const progress = route.totalAddresses > 0 
    ? Math.round((route.collectedAddresses / route.totalAddresses) * 100) 
    : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full bg-card rounded-2xl p-5 shadow-sm border border-border',
        'flex items-center gap-4 transition-all duration-150',
        'active:scale-[0.98] active:bg-accent/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <MapPin className="w-7 h-7 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 text-left min-w-0">
        <h3 className="text-lg font-bold text-foreground truncate">
          {route.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {route.updatedAt
            ? `Aktualizacja: ${new Date(route.updatedAt).toLocaleString('pl-PL')}`
            : 'Brak daty aktualizacji'}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            {route.collectedAddresses}/{route.totalAddresses}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
    </button>
  );
};
