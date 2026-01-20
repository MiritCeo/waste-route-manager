import { WasteType } from '@/types/waste';

export const WASTE_OPTIONS: Array<{ id: WasteType; name: string; icon: string }> = [
  { id: 'bio-green', name: 'Bio zielone', icon: '🌿' },
  { id: 'bio-kitchen', name: 'Bio kuchenne', icon: '🍂' },
  { id: 'glass-clear', name: 'Szkło bezbarwne', icon: '🫙' },
  { id: 'glass-colored', name: 'Szkło kolorowe', icon: '🍾' },
  { id: 'paper', name: 'Papier', icon: '📦' },
  { id: 'plastic', name: 'Plastik i metal', icon: '♻️' },
  { id: 'ash', name: 'Popiół', icon: '🔥' },
  { id: 'mixed', name: 'Zmieszane', icon: '🗑️' },
];

export const WASTE_LABELS: Record<WasteType, string> = WASTE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option.name;
    return acc;
  },
  {} as Record<WasteType, string>
);
