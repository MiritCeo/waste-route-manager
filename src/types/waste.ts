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

export type AddressStatus = 'PENDING' | 'COLLECTED' | 'DEFERRED' | 'ISSUE';

export type AddressIssueReason = string;

export type AddressIssueFlag = string;

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
  status?: AddressStatus;
  issueReason?: AddressIssueReason;
  issueFlags?: AddressIssueFlag[];
  issueNote?: string;
  issuePhoto?: string;
  ownerName?: string;
}

export interface Route {
  id: string;
  name: string;
  date?: string;
  updatedAt?: string;
  totalAddresses: number;
  collectedAddresses: number;
  addresses: Address[];
  publicationStatus?: 'DRAFT' | 'PUBLISHED';
}
