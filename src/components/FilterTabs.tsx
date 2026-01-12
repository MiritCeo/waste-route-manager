import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'pending' | 'collected';

interface FilterTabsProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  counts: {
    all: number;
    pending: number;
    collected: number;
  };
}

export const FilterTabs = ({ value, onChange, counts }: FilterTabsProps) => {
  const tabs: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'Wszystkie', count: counts.all },
    { id: 'pending', label: 'Do odbioru', count: counts.pending },
    { id: 'collected', label: 'Odebrane', count: counts.collected },
  ];

  return (
    <div className="flex gap-2 p-1 bg-secondary rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            value === tab.id
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground active:bg-accent'
          )}
        >
          <span>{tab.label}</span>
          <span className={cn(
            'ml-1.5 px-2 py-0.5 rounded-full text-xs',
            value === tab.id 
              ? 'bg-primary/10 text-primary' 
              : 'bg-background/50 text-muted-foreground'
          )}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
