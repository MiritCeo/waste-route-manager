export type WasteType = 
  | 'bio-green'
  | 'bio-kitchen'
  | 'glass-clear'
  | 'glass-colored'
  | 'paper'
  | 'plastic'
  | 'ash'
  | 'mixed';

export type AddressStatus = 'PENDING' | 'COLLECTED' | 'DEFERRED' | 'ISSUE';

export type AddressIssueReason =
  | 'NO_ACCESS'
  | 'NO_BIN'
  | 'CLOSED'
  | 'ROADWORKS'
  | 'NO_ENTRY';

export type AddressIssueFlag =
  | 'DAMAGED_BIN'
  | 'OVERFLOW'
  | 'NO_SEGREGATION';

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
  reportToAdmin?: boolean;
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
