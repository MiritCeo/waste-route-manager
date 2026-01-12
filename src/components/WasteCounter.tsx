import { Minus, Plus } from 'lucide-react';
import { WasteType } from '@/types/waste';
import { cn } from '@/lib/utils';

interface WasteCounterProps {
  type: WasteType;
  name: string;
  icon: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const wasteStyles: Record<WasteType, { bg: string; text: string; border: string }> = {
  'bio-green': {
    bg: 'bg-waste-bio-green-bg',
    text: 'text-waste-bio-green',
    border: 'border-waste-bio-green/30',
  },
  'bio-kitchen': {
    bg: 'bg-waste-bio-kitchen-bg',
    text: 'text-waste-bio-kitchen',
    border: 'border-waste-bio-kitchen/30',
  },
  'glass-clear': {
    bg: 'bg-waste-glass-clear-bg',
    text: 'text-waste-glass-clear',
    border: 'border-waste-glass-clear/30',
  },
  'glass-colored': {
    bg: 'bg-waste-glass-colored-bg',
    text: 'text-waste-glass-colored',
    border: 'border-waste-glass-colored/30',
  },
  'paper': {
    bg: 'bg-waste-paper-bg',
    text: 'text-waste-paper',
    border: 'border-waste-paper/30',
  },
  'plastic': {
    bg: 'bg-waste-plastic-bg',
    text: 'text-waste-plastic',
    border: 'border-waste-plastic/30',
  },
  'ash': {
    bg: 'bg-waste-ash-bg',
    text: 'text-waste-ash',
    border: 'border-waste-ash/30',
  },
  'mixed': {
    bg: 'bg-waste-mixed-bg',
    text: 'text-waste-mixed',
    border: 'border-waste-mixed/30',
  },
};

export const WasteCounter = ({
  type,
  name,
  icon,
  count,
  onIncrement,
  onDecrement,
}: WasteCounterProps) => {
  const styles = wasteStyles[type];

  return (
    <div
      className={cn(
        'rounded-2xl p-4 border-2 transition-all',
        styles.bg,
        styles.border,
        count > 0 && 'ring-2 ring-primary/20'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={cn('font-semibold text-base', styles.text)}>{name}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Decrement button */}
        <button
          onClick={onDecrement}
          disabled={count === 0}
          className={cn(
            'counter-btn border-2',
            styles.border,
            count === 0 
              ? 'opacity-40 cursor-not-allowed bg-background' 
              : 'bg-background active:bg-accent',
            styles.text
          )}
        >
          <Minus className="w-6 h-6" strokeWidth={3} />
        </button>

        {/* Count display */}
        <div
          className={cn(
            'flex-1 h-14 rounded-xl flex items-center justify-center',
            'text-3xl font-bold',
            count > 0 ? 'bg-primary text-primary-foreground' : 'bg-background',
            styles.border,
            'border-2'
          )}
        >
          {count}
        </div>

        {/* Increment button */}
        <button
          onClick={onIncrement}
          className={cn(
            'counter-btn border-2 bg-background active:bg-accent',
            styles.border,
            styles.text
          )}
        >
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
