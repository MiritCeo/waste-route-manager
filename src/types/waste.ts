export type WasteType = 
  | 'bio-green'
  | 'bio-kitchen'
  | 'glass-clear'
  | 'glass-colored'
  | 'paper'
  | 'plastic'
  | 'ash'
  | 'mixed';

export interface WasteCategory {
  id: WasteType;
  name: string;
  icon: string;
  count: number;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  city: string;
  isCollected: boolean;
  waste: WasteCategory[];
}

export interface Route {
  id: string;
  name: string;
  date: string;
  totalAddresses: number;
  collectedAddresses: number;
  addresses: Address[];
}
