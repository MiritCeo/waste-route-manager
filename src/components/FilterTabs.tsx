import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Clock, List, PauseCircle } from 'lucide-react';

export type FilterType = 'all' | 'pending' | 'collected' | 'deferred' | 'issues';

interface FilterTabsProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  counts: {
    all: number;
    pending: number;
    collected: number;
    deferred: number;
    issues: number;
  };
}

export const FilterTabs = ({ value, onChange, counts }: FilterTabsProps) => {
  const tabs: { id: FilterType; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'all', label: 'Wszystkie', count: counts.all, icon: List },
    { id: 'pending', label: 'Do odbioru', count: counts.pending, icon: Clock },
    { id: 'collected', label: 'Odebrane', count: counts.collected, icon: CheckCircle2 },
    { id: 'deferred', label: 'Odłożone', count: counts.deferred, icon: PauseCircle },
    { id: 'issues', label: 'Problemy', count: counts.issues, icon: AlertTriangle },
  ];

  return (
    <div className="bg-secondary rounded-xl">
      <div className="flex gap-2 p-1 overflow-x-auto whitespace-nowrap no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'shrink-0 py-3 px-4 rounded-lg font-semibold text-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              value === tab.id
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground active:bg-accent'
            )}
            aria-label={tab.label}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
            <span className={cn(
              'ml-1.5 px-2 py-0.5 rounded-full text-xs',
              value === tab.id 
                ? 'bg-primary/10 text-primary' 
                : 'bg-background/50 text-muted-foreground'
            )}>
              {tab.count}
            </span>
          </button>
        );})}
      </div>
    </div>
  );
};
