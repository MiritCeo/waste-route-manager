import { AddressIssueFlag, AddressIssueReason } from '@/types/waste';

export const ISSUE_REASON_LABELS: Record<AddressIssueReason, string> = {
  NO_ACCESS: 'Brak dostępu',
  NO_BIN: 'Brak pojemnika',
  CLOSED: 'Adres zamknięty',
  ROADWORKS: 'Ulica w remoncie',
  NO_ENTRY: 'Brak możliwości dojazdu',
};

export const ISSUE_FLAG_LABELS: Record<AddressIssueFlag, string> = {
  DAMAGED_BIN: 'Pojemniki uszkodzone',
  OVERFLOW: 'Pojemniki przepełnione',
  NO_SEGREGATION: 'Brak segregacji',
};
