import { memo } from 'react';
import { Check, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { Address, AddressStatus } from '@/types/waste';
import { cn } from '@/lib/utils';

interface AddressCardProps {
  address: Address;
  hasDraft?: boolean;
  onSelect: (addressId: string) => void;
  className?: string;
}

const getAddressStatus = (address: Address): AddressStatus => {
  if (address.status) return address.status;
  return address.isCollected ? 'COLLECTED' : 'PENDING';
};

const STATUS_LABELS: Record<AddressStatus, string> = {
  PENDING: 'Do odbioru',
  COLLECTED: 'Odebrane',
  DEFERRED: 'Odłożone',
  ISSUE: 'Problem',
};

export const AddressCard = memo(({ address, hasDraft, onSelect, className }: AddressCardProps) => {
  const status = getAddressStatus(address);
  const isCollected = status === 'COLLECTED';
  const isIssue = status === 'ISSUE';
  const isDeferred = status === 'DEFERRED';
  const isCompany = Boolean(address.ownerName);

  return (
    <button
      onClick={() => onSelect(address.id)}
      className={cn(
        'w-full bg-card rounded-2xl p-4 shadow-sm border',
        'flex items-center gap-4 transition-all duration-150',
        'active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isCollected 
          ? 'border-success/30 bg-success/5' 
          : isIssue
            ? 'border-destructive/30 bg-destructive/5'
            : isDeferred
              ? 'border-warning/30 bg-warning/5'
              : 'border-border active:bg-accent/50'
        ,
        className
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          isCollected 
            ? 'bg-success text-success-foreground' 
            : isIssue
              ? 'bg-destructive text-destructive-foreground'
              : isDeferred
                ? 'bg-warning text-warning-foreground'
                : 'bg-warning/20 text-warning'
        )}
      >
        {isCollected ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : isIssue ? (
          <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
        ) : (
          <Clock className="w-6 h-6" strokeWidth={2.5} />
        )}
      </div>

      {/* Address Info */}
      <div className="flex-1 text-left min-w-0">
        <h3 className={cn(
          'text-lg font-bold truncate',
          isCollected ? 'text-success' : isIssue ? 'text-destructive' : 'text-foreground'
        )}>
          {address.street} {address.number}
        </h3>
        <p className="text-sm text-muted-foreground">{address.city}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium border',
            isCollected
              ? 'border-success/30 text-success'
              : isIssue
                ? 'border-destructive/30 text-destructive'
                : isDeferred
                  ? 'border-warning/30 text-warning'
                  : 'border-muted/40 text-muted-foreground'
          )}>
            {STATUS_LABELS[status]}
          </span>
          {isCompany && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/30 text-blue-500">
              Firma
            </span>
          )}
          {hasDraft && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-primary/30 text-primary">
              Zapis roboczy
            </span>
          )}
        </div>
      </div>

      <ChevronRight className={cn(
        'w-6 h-6 flex-shrink-0',
        isCollected ? 'text-success/50' : isIssue ? 'text-destructive/50' : 'text-muted-foreground'
      )} />
    </button>
  );
});

AddressCard.displayName = 'AddressCard';
