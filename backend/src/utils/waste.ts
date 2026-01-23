export type WasteType =
  | 'bio-green'
  | 'bio-green-240'
  | 'bio-green-1100'
  | 'bio-kitchen'
  | 'bio-kitchen-240'
  | 'bio-kitchen-1100'
  | 'glass-clear'
  | 'glass-clear-1100'
  | 'glass-colored'
  | 'glass-colored-1100'
  | 'paper'
  | 'paper-1100'
  | 'plastic'
  | 'plastic-1100'
  | 'ash'
  | 'mixed'
  | 'mixed-240'
  | 'mixed-1100';

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

export const buildWasteCategories = (types: WasteType[]) => {
  return types.map(type => {
    const option = WASTE_OPTIONS.find(item => item.id === type);
    return {
      id: type,
      name: option?.name || type,
      icon: option?.icon || '🗑️',
      count: 0,
    };
  });
};
