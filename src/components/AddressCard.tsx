import { Check, Clock, ChevronRight } from 'lucide-react';
import { Address } from '@/types/waste';
import { cn } from '@/lib/utils';

interface AddressCardProps {
  address: Address;
  onClick: () => void;
}

export const AddressCard = ({ address, onClick }: AddressCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full bg-card rounded-2xl p-4 shadow-sm border',
        'flex items-center gap-4 transition-all duration-150',
        'active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        address.isCollected 
          ? 'border-success/30 bg-success/5' 
          : 'border-border active:bg-accent/50'
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          address.isCollected 
            ? 'bg-success text-success-foreground' 
            : 'bg-warning/20 text-warning'
        )}
      >
        {address.isCollected ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : (
          <Clock className="w-6 h-6" strokeWidth={2.5} />
        )}
      </div>

      {/* Address Info */}
      <div className="flex-1 text-left min-w-0">
        <h3 className={cn(
          'text-lg font-bold truncate',
          address.isCollected ? 'text-success' : 'text-foreground'
        )}>
          {address.street} {address.number}
        </h3>
        <p className="text-sm text-muted-foreground">{address.city}</p>
      </div>

      {/* Arrow */}
      <ChevronRight className={cn(
        'w-6 h-6 flex-shrink-0',
        address.isCollected ? 'text-success/50' : 'text-muted-foreground'
      )} />
    </button>
  );
};
