import { WasteType } from '@/types/waste';

export const WASTE_OPTIONS: Array<{ id: WasteType; name: string; icon: string }> = [
  { id: 'bio-green', name: 'Bio zielone 120L', icon: '🌿' },
  { id: 'bio-green-240', name: 'Bio zielone 240L', icon: '🌿' },
  { id: 'bio-green-1100', name: 'Bio zielone 1100L', icon: '🌿' },
  { id: 'bio-kitchen', name: 'Bio kuchenne 120L', icon: '🍂' },
  { id: 'bio-kitchen-240', name: 'Bio kuchenne 240L', icon: '🍂' },
  { id: 'bio-kitchen-1100', name: 'Bio kuchenne 1100L', icon: '🍂' },
  { id: 'glass-clear', name: 'Szkło bezbarwne', icon: '🫙' },
  { id: 'glass-clear-1100', name: 'Szkło bezbarwne 1100L', icon: '🫙' },
  { id: 'glass-colored', name: 'Szkło kolorowe', icon: '🍾' },
  { id: 'glass-colored-1100', name: 'Szkło kolorowe 1100L', icon: '🍾' },
  { id: 'paper', name: 'Papier', icon: '📦' },
  { id: 'paper-1100', name: 'Papier 1100L', icon: '📦' },
  { id: 'plastic', name: 'Plastik i metal', icon: '♻️' },
  { id: 'plastic-1100', name: 'Plastik i metal 1100L', icon: '♻️' },
  { id: 'ash', name: 'Popiół', icon: '🔥' },
  { id: 'mixed', name: 'Zmieszane 120L', icon: '🗑️' },
  { id: 'mixed-240', name: 'Zmieszane 240L', icon: '🗑️' },
  { id: 'mixed-1100', name: 'Zmieszane 1100L', icon: '🗑️' },
];

export const BASE_WASTE_OPTIONS = WASTE_OPTIONS.filter(
  option => !option.id.endsWith('-240') && !option.id.endsWith('-1100')
);

/** Unikalne ikony z definicji pojemników — wybór przy dodawaniu w ustawieniach */
export const WASTE_CONTAINER_ICON_CHOICES: string[] = Array.from(
  new Set(WASTE_OPTIONS.map(option => option.icon))
);

export const WASTE_LABELS: Record<WasteType, string> = WASTE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option.name;
    return acc;
  },
  {} as Record<WasteType, string>
);
