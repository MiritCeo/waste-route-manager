import { useState } from 'react';
import { Address, WasteCategory } from '@/types/waste';
import { WasteCounter } from '@/components/WasteCounter';
import { Header } from '@/components/Header';
import { Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CollectionViewProps {
  address: Address;
  onBack: () => void;
  onSave: (updatedWaste: WasteCategory[]) => void;
}

export const CollectionView = ({ address, onBack, onSave }: CollectionViewProps) => {
  const [waste, setWaste] = useState<WasteCategory[]>(address.waste);
  const [isSaving, setIsSaving] = useState(false);

  const handleIncrement = (id: string) => {
    setWaste(prev =>
      prev.map(w => (w.id === id ? { ...w, count: w.count + 1 } : w))
    );
  };

  const handleDecrement = (id: string) => {
    setWaste(prev =>
      prev.map(w => (w.id === id && w.count > 0 ? { ...w, count: w.count - 1 } : w))
    );
  };

  const totalCount = waste.reduce((sum, w) => sum + w.count, 0);

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate save delay for feedback
    setTimeout(() => {
      onSave(waste);
      toast.success('Odbiór zapisany!', {
        description: `${address.street} ${address.number} - ${totalCount} pojemników`,
        duration: 3000,
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={`${address.street} ${address.number}`}
        subtitle={address.city}
        onBack={onBack}
        rightElement={
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
        }
      />

      <main className="flex-1 p-4 space-y-3 pb-32 overflow-auto">
        {waste.map((category) => (
          <WasteCounter
            key={category.id}
            type={category.id}
            name={category.name}
            icon={category.icon}
            count={category.count}
            onIncrement={() => handleIncrement(category.id)}
            onDecrement={() => handleDecrement(category.id)}
          />
        ))}
      </main>

      {/* Fixed bottom save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'w-full py-5 rounded-2xl font-bold text-lg',
            'flex items-center justify-center gap-3',
            'transition-all duration-150',
            'focus:outline-none focus:ring-4 focus:ring-primary/30',
            totalCount > 0
              ? 'bg-primary text-primary-foreground active:scale-[0.98] shadow-lg shadow-primary/25'
              : 'bg-secondary text-secondary-foreground',
            isSaving && 'opacity-70 cursor-wait'
          )}
        >
          <Check className="w-6 h-6" strokeWidth={3} />
          <span>
            Zapisz odbiór
            {totalCount > 0 && (
              <span className="ml-2 px-3 py-1 bg-primary-foreground/20 rounded-full text-base">
                {totalCount}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
