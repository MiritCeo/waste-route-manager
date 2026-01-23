import { IssueConfig } from '@/types/issueConfig';

export const DEFAULT_ISSUE_CONFIG: IssueConfig = {
  issueReasons: [
    { id: 'NO_ACCESS', label: 'Brak dostępu' },
    { id: 'NO_BIN', label: 'Brak pojemnika' },
    { id: 'CLOSED', label: 'Adres zamknięty' },
    { id: 'ROADWORKS', label: 'Ulica w remoncie' },
    { id: 'NO_ENTRY', label: 'Brak możliwości dojazdu' },
  ],
  deferredReasons: [
    { id: 'NO_ACCESS', label: 'Brak dostępu' },
    { id: 'NO_BIN', label: 'Brak pojemnika' },
    { id: 'CLOSED', label: 'Adres zamknięty' },
    { id: 'ROADWORKS', label: 'Ulica w remoncie' },
    { id: 'NO_ENTRY', label: 'Brak możliwości dojazdu' },
  ],
  issueFlags: [
    { id: 'DAMAGED_BIN', label: 'Pojemniki uszkodzone' },
    { id: 'OVERFLOW', label: 'Pojemniki przepełnione' },
    { id: 'NO_SEGREGATION', label: 'Brak segregacji' },
  ],
};
