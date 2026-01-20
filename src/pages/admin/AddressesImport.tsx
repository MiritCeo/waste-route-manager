import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { adminService } from '@/api/services/admin.service';
import { buildAddressKey, formatAddressLabel, normalizeCityName } from '@/utils/addressKeys';
import { WASTE_OPTIONS } from '@/constants/waste';
import { WasteType } from '@/types/waste';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { DeclaredContainer } from '@/types/admin';

type ParsedAddress = {
  street: string;
  number: string;
  city: string;
  postalCode?: string;
  notes: string;
  wasteTypes: WasteType[];
  declaredContainers: DeclaredContainer[];
  source: 'company' | 'residential';
  occurrences: number;
  owner?: string;
};

type DuplicateInfo = {
  key: string;
  label: string;
  count: number;
  sources: Array<ParsedAddress['source']>;
  details: Array<{
    source: ParsedAddress['source'];
    owner?: string;
    occurrences: number;
  }>;
};

type InvalidAddressRow = {
  id: string;
  source: ParsedAddress['source'];
  rowIndex: number;
  rawAddress: string;
  owner?: string;
  reason: string;
  street: string;
  number: string;
  city: string;
  postalCode?: string;
  notes: string;
  wasteTypes: WasteType[];
  declaredContainers: DeclaredContainer[];
};

type ImportSummary = {
  totalRows: number;
  uniqueAddresses: number;
  created: number;
  skippedExisting: number;
  duplicates: DuplicateInfo[];
  invalidRows: number;
  invalidEntries: InvalidAddressRow[];
};

const readFileAsText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!utf8.includes('�')) {
    return utf8;
  }
  return new TextDecoder('windows-1250', { fatal: false }).decode(buffer);
};

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseCsv = (text: string, delimiter = ';'): string[][] => {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => splitCsvLine(line, delimiter));
};

const splitStreetNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { street: '', number: '' };
  }

  const match = trimmed.match(/^(.*?)(\s+\d.*)$/);
  if (match) {
    return { street: match[1].trim(), number: match[2].trim() };
  }

  return { street: trimmed, number: '' };
};

const parseAddressValue = (value: string) => {
  const parts = value.split(',').map(item => item.trim()).filter(Boolean);
  const postalCityPart = parts[0] ?? '';
  const localityPart = parts.length >= 3 ? parts[1] ?? '' : '';
  const streetPart = parts.length >= 3 ? parts.slice(2).join(', ') : parts[1] ?? '';
  const postalMatch = postalCityPart.match(/\d{2}-\d{3}/);
  const postalCode = postalMatch?.[0];
  const postalCity = postalMatch
    ? postalCityPart.replace(postalMatch[0], '').trim()
    : postalCityPart.trim();
  const city = normalizeCityName(localityPart || postalCity);
  const { street, number } = splitStreetNumber(streetPart);

  return { street, number, city, postalCode };
};

const mapWasteTypes = (container: string): WasteType[] => {
  const normalized = container.toLowerCase();
  const types = new Set<WasteType>();

  if (normalized.includes('papier')) types.add('paper');
  if (normalized.includes('plastik') || normalized.includes('metal')) types.add('plastic');
  if (normalized.includes('szkło') || normalized.includes('szklo')) {
    if (normalized.includes('bezbarw')) types.add('glass-clear');
    else types.add('glass-colored');
  }
  if (normalized.includes('bio')) types.add('bio-green');
  if (normalized.includes('popiół') || normalized.includes('popiol')) types.add('ash');
  if (normalized.includes('zmiesz')) types.add('mixed');

  return Array.from(types);
};

const buildNotes = (lines: string[]): string => {
  return lines.filter(Boolean).join('\n');
};

const parseDeclaredCount = (value?: string): number => {
  if (!value) return 0;
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildContainerKey = (name: string, frequency?: string) =>
  `${name.toLowerCase().trim()}::${(frequency || '').toLowerCase().trim()}`;

const mergeDeclaredContainers = (
  current: DeclaredContainer[],
  incoming: DeclaredContainer[]
) => {
  const map = new Map<string, DeclaredContainer>();
  current.forEach(item => {
    map.set(buildContainerKey(item.name, item.frequency), { ...item });
  });
  incoming.forEach(item => {
    const key = buildContainerKey(item.name, item.frequency);
    const existing = map.get(key);
    if (existing) {
      existing.count += item.count;
    } else {
      map.set(key, { ...item });
    }
  });
  return Array.from(map.values());
};

const normalizeOwner = (value?: string) => {
  if (!value) return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
};

const buildImportKey = (entry: ParsedAddress) => {
  const baseKey = buildAddressKey(entry);
  if (entry.source === 'company') {
    return `${baseKey}::company::${normalizeOwner(entry.owner)}`;
  }
  return `${baseKey}::residential`;
};

const extractOwnersFromNotes = (notes?: string) => {
  if (!notes) return [];
  const line = notes.split('\n').find(item => item.startsWith('Właściciel:'));
  if (!line) return [];
  const value = line.replace('Właściciel:', '').trim();
  if (!value) return [];
  return value.split(',').map(owner => owner.trim()).filter(Boolean);
};

const parseDateValue = (value?: string): number => {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '-');
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const wasteEnum = z.enum(WASTE_OPTIONS.map(option => option.id) as [WasteType, ...WasteType[]]);
const addressSchema = z.object({
  street: z.string().min(2, 'Podaj ulicę'),
  number: z.string().min(1, 'Podaj numer'),
  city: z.string().min(2, 'Podaj miasto'),
  postalCode: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  wasteTypes: z.array(wasteEnum).min(1, 'Wybierz przynajmniej jeden typ odpadu'),
  active: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export const AddressesImport = () => {
  const navigate = useNavigate();
  const [companyFile, setCompanyFile] = useState<File | null>(null);
  const [residentialFile, setResidentialFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [editingInvalid, setEditingInvalid] = useState<InvalidAddressRow | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateInfo | null>(null);
  const manualForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      number: '',
      city: '',
      postalCode: '',
      notes: '',
      wasteTypes: [],
      active: true,
    },
  });

  const duplicatePreview = useMemo(() => {
    if (!summary?.duplicates?.length) return [];
    return summary.duplicates.slice(0, 20);
  }, [summary]);

  const parseCompanyFile = (rows: string[][]) => {
    const groups = new Map<
      string,
      ParsedAddress & { owners: Set<string>; containerMap: Map<string, DeclaredContainer> }
    >();
    let invalidRows = 0;
    const invalidEntries: InvalidAddressRow[] = [];

    rows.slice(1).forEach(row => {
      const owner = row[1]?.trim();
      const addressValue = row[2]?.trim();
      const container = row[3]?.trim();
      const count = row[4]?.trim();
      const frequency = row[5]?.trim();

      if (!addressValue) {
        invalidRows += 1;
        invalidEntries.push({
          id: `company_${invalidRows}_${Date.now()}`,
          source: 'company',
          rowIndex: invalidRows,
          rawAddress: '',
          owner,
          reason: 'Brak adresu',
          street: '',
          number: '',
          city: '',
          postalCode: undefined,
          notes: buildNotes(['Typ: Firma', owner ? `Właściciel: ${owner}` : '']),
          wasteTypes: mapWasteTypes(container || ''),
          declaredContainers: container
            ? [
                {
                  name: container,
                  count: parseDeclaredCount(count),
                  frequency,
                },
              ]
            : [],
        });
        return;
      }

      const { street, number, city, postalCode } = parseAddressValue(addressValue);
      if (!street || !city) {
        invalidRows += 1;
        invalidEntries.push({
          id: `company_${invalidRows}_${Date.now()}`,
          source: 'company',
          rowIndex: invalidRows,
          rawAddress: addressValue,
          owner,
          reason: 'Brak ulicy lub miasta',
          street,
          number,
          city,
          postalCode,
          notes: buildNotes(['Typ: Firma', owner ? `Właściciel: ${owner}` : '']),
          wasteTypes: mapWasteTypes(container || ''),
          declaredContainers: container
            ? [
                {
                  name: container,
                  count: parseDeclaredCount(count),
                  frequency,
                },
              ]
            : [],
        });
        return;
      }

      const ownerKey = normalizeOwner(owner);
      const key = `${buildAddressKey({ street, number, city, postalCode })}::${ownerKey}`;
      const existing = groups.get(key);
      const declaredCount = parseDeclaredCount(count);
      const containerKey = container ? buildContainerKey(container, frequency) : '';

      if (existing) {
        existing.occurrences += 1;
        if (owner) existing.owners.add(owner);
        if (container && containerKey) {
          const stored = existing.containerMap.get(containerKey);
          if (stored) {
            stored.count += declaredCount;
          } else {
            existing.containerMap.set(containerKey, {
              name: container,
              count: declaredCount,
              frequency,
            });
          }
        }
        mapWasteTypes(container || '').forEach(type => existing.wasteTypes.push(type));
        return;
      }

      const wasteTypes = mapWasteTypes(container || '');
      const containerMap = new Map<string, DeclaredContainer>();
      if (container && containerKey) {
        containerMap.set(containerKey, {
          name: container,
          count: declaredCount,
          frequency,
        });
      }
      groups.set(key, {
        street,
        number,
        city,
        postalCode,
        notes: '',
        wasteTypes: wasteTypes.length ? wasteTypes : ['mixed'],
        declaredContainers: [],
        source: 'company',
        occurrences: 1,
        owner,
        owners: new Set(owner ? [owner] : []),
        containerMap,
      });
    });

    const entries = Array.from(groups.values()).map(entry => {
      const ownerLabel = Array.from(entry.owners.values()).filter(Boolean).join(', ');
      const declaredContainers = Array.from(entry.containerMap.values());
      const containerLabel = declaredContainers
        .map(item => {
          const countLabel = item.count ? ` x${item.count}` : '';
          const freqLabel = item.frequency ? ` / ${item.frequency}` : '';
          return `${item.name}${countLabel}${freqLabel}`;
        })
        .filter(Boolean)
        .join(' | ');
      const notes = buildNotes([
        'Typ: Firma',
        ownerLabel ? `Właściciel: ${ownerLabel}` : '',
        containerLabel ? `Deklaracje: ${containerLabel}` : '',
      ]);

      const uniqueWaste = Array.from(new Set(entry.wasteTypes));
      return {
        street: entry.street,
        number: entry.number,
        city: entry.city,
        postalCode: entry.postalCode,
        notes,
        wasteTypes: uniqueWaste.length ? uniqueWaste : ['mixed'],
        declaredContainers,
        source: entry.source,
        occurrences: entry.occurrences,
        owner: ownerLabel,
      };
    });

    return { entries, invalidRows, invalidEntries };
  };

  const parseResidentialFile = (rows: string[][]) => {
    const groups = new Map<
      string,
      ParsedAddress & {
        changeFrom?: string;
        declarationNumber?: string;
        residents?: string;
        rate?: string;
        latestTimestamp?: number;
      }
    >();
    let invalidRows = 0;
    const invalidEntries: InvalidAddressRow[] = [];

    rows.slice(1).forEach(row => {
      const addressValue = row[1]?.trim();
      const declarationNumber = row[2]?.trim();
      const changeFrom = row[3]?.trim();
      const residents = row[4]?.trim();
      const rate = row[5]?.trim();

      if (!addressValue) {
        invalidRows += 1;
        invalidEntries.push({
          id: `residential_${invalidRows}_${Date.now()}`,
          source: 'residential',
          rowIndex: invalidRows,
          rawAddress: '',
          reason: 'Brak adresu',
          street: '',
          number: '',
          city: '',
          postalCode: undefined,
          notes: buildNotes([
            'Typ: Nieruchomość zamieszkała',
            declarationNumber ? `Numer deklaracji: ${declarationNumber}` : '',
            changeFrom ? `Zmiana od: ${changeFrom}` : '',
            residents ? `Liczba mieszkańców: ${residents}` : '',
            rate ? `Stawka: ${rate}` : '',
          ]),
          wasteTypes: ['mixed'],
          declaredContainers: [],
        });
        return;
      }

      const { street, number, city, postalCode } = parseAddressValue(addressValue);
      if (!street || !city) {
        invalidRows += 1;
        invalidEntries.push({
          id: `residential_${invalidRows}_${Date.now()}`,
          source: 'residential',
          rowIndex: invalidRows,
          rawAddress: addressValue,
          reason: 'Brak ulicy lub miasta',
          street,
          number,
          city,
          postalCode,
          notes: buildNotes([
            'Typ: Nieruchomość zamieszkała',
            declarationNumber ? `Numer deklaracji: ${declarationNumber}` : '',
            changeFrom ? `Zmiana od: ${changeFrom}` : '',
            residents ? `Liczba mieszkańców: ${residents}` : '',
            rate ? `Stawka: ${rate}` : '',
          ]),
          wasteTypes: ['mixed'],
          declaredContainers: [],
        });
        return;
      }

      const key = buildAddressKey({ street, number, city, postalCode });
      const existing = groups.get(key);
      const timestamp = parseDateValue(changeFrom);

      if (existing) {
        existing.occurrences += 1;
        if (!existing.latestTimestamp || timestamp >= existing.latestTimestamp) {
          existing.changeFrom = changeFrom;
          existing.declarationNumber = declarationNumber;
          existing.residents = residents;
          existing.rate = rate;
          existing.latestTimestamp = timestamp;
        }
        return;
      }

      groups.set(key, {
        street,
        number,
        city,
        postalCode,
        notes: '',
        wasteTypes: ['mixed'],
        declaredContainers: [],
        source: 'residential',
        occurrences: 1,
        changeFrom,
        declarationNumber,
        residents,
        rate,
        latestTimestamp: timestamp,
      });
    });

    const entries = Array.from(groups.values()).map(entry => {
      const notes = buildNotes([
        'Typ: Nieruchomość zamieszkała',
        entry.declarationNumber ? `Numer deklaracji: ${entry.declarationNumber}` : '',
        entry.changeFrom ? `Zmiana od: ${entry.changeFrom}` : '',
        entry.residents ? `Liczba mieszkańców: ${entry.residents}` : '',
        entry.rate ? `Stawka: ${entry.rate}` : '',
      ]);

      return {
        street: entry.street,
        number: entry.number,
        city: entry.city,
        postalCode: entry.postalCode,
        notes,
        wasteTypes: entry.wasteTypes,
        declaredContainers: [],
        source: entry.source,
        occurrences: entry.occurrences,
      };
    });

    return { entries, invalidRows, invalidEntries };
  };

  const buildDuplicates = (entries: ParsedAddress[]) => {
    const map = new Map<
      string,
      {
        label: string;
        sources: Set<ParsedAddress['source']>;
        owners: Set<string>;
        companyCount: number;
        residentialCount: number;
        details: DuplicateInfo['details'];
      }
    >();

    entries.forEach(entry => {
      const key = buildAddressKey(entry);
      const current = map.get(key);
      if (current) {
        current.sources.add(entry.source);
        if (entry.source === 'company') {
          current.companyCount += entry.occurrences;
          if (entry.owner) current.owners.add(entry.owner);
        } else {
          current.residentialCount += entry.occurrences;
        }
        current.details.push({
          source: entry.source,
          owner: entry.owner,
          occurrences: entry.occurrences,
        });
      } else {
        map.set(key, {
          label: formatAddressLabel(entry),
          sources: new Set([entry.source]),
          owners: new Set(entry.owner ? [entry.owner] : []),
          companyCount: entry.source === 'company' ? entry.occurrences : 0,
          residentialCount: entry.source === 'residential' ? entry.occurrences : 0,
          details: [
            {
              source: entry.source,
              owner: entry.owner,
              occurrences: entry.occurrences,
            },
          ],
        });
      }
    });

    return Array.from(map.entries())
      .filter(([, info]) => info.owners.size > 1 || info.residentialCount > 1)
      .map(([key, info]) => ({
        key,
        label: info.label,
        count: info.companyCount + info.residentialCount,
        sources: Array.from(info.sources.values()),
        details: info.details,
      }));
  };

  const mergeEntries = (entries: ParsedAddress[]) => {
    const map = new Map<string, ParsedAddress & { notesParts: Set<string> }>();

    entries.forEach(entry => {
      const key = buildImportKey(entry);
      const current = map.get(key);
      if (current) {
        current.notesParts.add(entry.notes);
        current.declaredContainers = mergeDeclaredContainers(
          current.declaredContainers,
          entry.declaredContainers
        );
        entry.wasteTypes.forEach(type => {
          if (!current.wasteTypes.includes(type)) {
            current.wasteTypes.push(type);
          }
        });
        current.occurrences += entry.occurrences;
        return;
      }

      map.set(key, {
        ...entry,
        notesParts: new Set([entry.notes]),
      });
    });

    return Array.from(map.values()).map(entry => ({
      ...entry,
      notes: buildNotes(Array.from(entry.notesParts.values())),
    }));
  };

  const handleClear = async () => {
    const confirmed = window.confirm('Czy na pewno wyczyścić bazę adresów?');
    if (!confirmed) return;

    setIsImporting(true);
    setSummary(null);
    try {
      await adminService.clearAddresses();
      toast.success('Wyczyszczono bazę adresów');
    } catch (error) {
      console.error('Clear addresses failed:', error);
      toast.error('Nie udało się wyczyścić bazy adresów');
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenManual = (row: InvalidAddressRow) => {
    setEditingInvalid(row);
    manualForm.reset({
      street: row.street || '',
      number: row.number || '',
      city: row.city || '',
      postalCode: row.postalCode || '',
      notes: row.notes || '',
      wasteTypes: row.wasteTypes.length ? row.wasteTypes : ['mixed'],
      active: true,
    });
    setIsManualDialogOpen(true);
  };

  const handleManualSubmit = async (values: AddressFormValues) => {
    if (!editingInvalid) return;
    try {
      await adminService.createAddress({
        street: values.street,
        number: values.number,
        city: normalizeCityName(values.city),
        postalCode: values.postalCode || undefined,
        notes: values.notes || undefined,
        wasteTypes: values.wasteTypes,
        declaredContainers: editingInvalid.declaredContainers,
        active: values.active,
      });
      toast.success('Dodano adres');
      setSummary(prev =>
        prev
          ? {
              ...prev,
              invalidEntries: prev.invalidEntries.filter(item => item.id !== editingInvalid.id),
              invalidRows: Math.max(0, prev.invalidRows - 1),
            }
          : prev
      );
      setIsManualDialogOpen(false);
    } catch (error) {
      console.error('Manual add failed:', error);
      toast.error('Nie udało się dodać adresu');
    }
  };

  const handleImport = async () => {
    if (!companyFile && !residentialFile) {
      toast.error('Wybierz przynajmniej jeden plik do importu');
      return;
    }

    setIsImporting(true);
    setSummary(null);

    try {
      let totalRows = 0;
      let invalidRows = 0;
      const invalidEntries: InvalidAddressRow[] = [];
      const allEntries: ParsedAddress[] = [];

      if (companyFile) {
        const text = await readFileAsText(companyFile);
        const rows = parseCsv(text);
        totalRows += Math.max(rows.length - 1, 0);
        const result = parseCompanyFile(rows);
        invalidRows += result.invalidRows;
        invalidEntries.push(...result.invalidEntries);
        allEntries.push(...result.entries);
      }

      if (residentialFile) {
        const text = await readFileAsText(residentialFile);
        const rows = parseCsv(text);
        totalRows += Math.max(rows.length - 1, 0);
        const result = parseResidentialFile(rows);
        invalidRows += result.invalidRows;
        invalidEntries.push(...result.invalidEntries);
        allEntries.push(...result.entries);
      }

      const duplicates = buildDuplicates(allEntries);
      const mergedEntries = mergeEntries(allEntries);
      const existingAddresses = await adminService.getAddresses();
      const existingKeys = new Set<string>();
      existingAddresses.forEach(address => {
        const baseKey = buildAddressKey({
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode,
        });
        const owners = extractOwnersFromNotes(address.notes);
        if (owners.length) {
          owners.forEach(owner => {
            existingKeys.add(`${baseKey}::company::${normalizeOwner(owner)}`);
          });
        } else {
          existingKeys.add(`${baseKey}::residential`);
        }
      });

      const toCreate = mergedEntries.filter(entry => !existingKeys.has(buildImportKey(entry)));
      const { created, skippedExisting } = await adminService.importAddresses(
        toCreate.map(entry => ({
          street: entry.street,
          number: entry.number,
          city: entry.city,
          postalCode: entry.postalCode,
          notes: entry.notes,
          wasteTypes: entry.wasteTypes.length ? entry.wasteTypes : ['mixed'],
          declaredContainers: entry.declaredContainers,
          active: true,
        }))
      );

      setSummary({
        totalRows,
        uniqueAddresses: mergedEntries.length,
        created,
        skippedExisting: skippedExisting + (mergedEntries.length - toCreate.length),
        duplicates,
        invalidRows,
        invalidEntries,
      });

      toast.success(`Zaimportowano ${created} adresów`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import nie powiódł się');
    } finally {
      setIsImporting(false);
    }
  };

  const wasteLegend = useMemo(() => WASTE_OPTIONS.map(option => option.name).join(', '), []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Import adresów"
        subtitle="Import z plików ewidencyjnych"
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-6 max-w-5xl mx-auto">
        <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pliki do importu</h2>
              <p className="text-sm text-muted-foreground">
                Obsługiwany format: CSV (separator średnik, kodowanie UTF-8 lub Windows-1250)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Firmy i pojemniki</p>
              <Input
                type="file"
                accept=".csv"
                onChange={(event) => setCompanyFile(event.target.files?.[0] || null)}
              />
              {companyFile && (
                <p className="text-xs text-muted-foreground">{companyFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Nieruchomości zamieszkałe</p>
              <Input
                type="file"
                accept=".csv"
                onChange={(event) => setResidentialFile(event.target.files?.[0] || null)}
              />
              {residentialFile && (
                <p className="text-xs text-muted-foreground">{residentialFile.name}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="gap-2"
              onClick={handleImport}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importowanie...' : 'Importuj dane'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.ADMIN.ADDRESSES)}
            >
              Przejdź do adresów
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={isImporting}
            >
              Wyczyść bazę adresów
            </Button>
          </div>
        </div>

        {summary && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Wiersze w plikach</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalRows}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Unikalne adresy</p>
                <p className="text-2xl font-bold text-foreground">{summary.uniqueAddresses}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Dodane do bazy</p>
                <p className="text-2xl font-bold text-foreground">{summary.created}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Pominięte / błędne</p>
                <p className="text-2xl font-bold text-foreground">
                  {summary.skippedExisting + summary.invalidRows}
                </p>
              </div>
            </div>

            {summary.invalidRows > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Niepoprawne wiersze</AlertTitle>
                <AlertDescription>
                  Pominięto {summary.invalidRows} wierszy bez poprawnego adresu.
                </AlertDescription>
              </Alert>
            )}

            {summary.duplicates.length > 0 && (
              <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  Wykryto powtórzenia adresów ({summary.duplicates.length})
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adres</TableHead>
                      <TableHead>Liczba wystąpień</TableHead>
                      <TableHead>Źródła</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicatePreview.map(dup => (
                      <TableRow key={dup.key}>
                        <TableCell>{dup.label}</TableCell>
                        <TableCell>{dup.count}</TableCell>
                        <TableCell>
                          {dup.sources.map(source => (
                            <span
                              key={source}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/40 text-muted-foreground mr-2"
                            >
                              {source === 'company' ? 'Firma' : 'Zamieszkała'}
                            </span>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDuplicate(dup)}
                          >
                            Szczegóły
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {summary.duplicates.length > duplicatePreview.length && (
                  <p className="text-xs text-muted-foreground">
                    Wyświetlono pierwsze {duplicatePreview.length} pozycji.
                  </p>
                )}
              </div>
            )}

            <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                Adresy z błędami ({summary.invalidEntries.length})
              </div>
              {summary.invalidEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak błędnych wpisów do ręcznej poprawy.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Źródło</TableHead>
                      <TableHead>Adres z pliku</TableHead>
                      <TableHead>Powód</TableHead>
                      <TableHead>Akcja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.invalidEntries.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.source === 'company' ? 'Firma' : 'Zamieszkała'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {row.rawAddress || 'Brak adresu'}
                          </div>
                          {row.owner && (
                            <div className="text-xs text-muted-foreground">
                              {row.owner}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleOpenManual(row)}>
                            Edytuj i dodaj
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <Alert>
              <AlertTitle>Podgląd mapowania odpadów</AlertTitle>
              <AlertDescription>
                Typy odpadów są mapowane na podstawie nazw pojemników/worków. Dostępne typy:{' '}
                {wasteLegend}.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>

      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Popraw adres i dodaj do bazy</DialogTitle>
            <DialogDescription>
              Uzupełnij brakujące dane i zapisz adres ręcznie.
            </DialogDescription>
          </DialogHeader>

          <Form {...manualForm}>
            <form className="grid gap-4" onSubmit={manualForm.handleSubmit(handleManualSubmit)}>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={manualForm.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ulica</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miasto</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kod pocztowy</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={manualForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notatki</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={manualForm.control}
                name="wasteTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typy odpadów</FormLabel>
                    <div className="grid gap-2 md:grid-cols-2">
                      {WASTE_OPTIONS.map(option => {
                        const isChecked = field.value.includes(option.id);
                        return (
                          <label key={option.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const nextValue = checked
                                  ? [...field.value, option.id]
                                  : field.value.filter(type => type !== option.id);
                                field.onChange(nextValue);
                              }}
                            />
                            {option.icon} {option.name}
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={manualForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      />
                      Adres aktywny
                    </label>
                  </FormItem>
                )}
              />

              {editingInvalid?.declaredContainers.length ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground mb-2">Zadeklarowane pojemniki</p>
                  <ul className="text-muted-foreground space-y-1">
                    {editingInvalid.declaredContainers.map((item, index) => (
                      <li key={`${item.name}-${index}`}>
                        {item.name} x{item.count}
                        {item.frequency ? ` / ${item.frequency}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsManualDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit">Dodaj adres</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDuplicate)} onOpenChange={(open) => !open && setSelectedDuplicate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Powtórzenie adresu</DialogTitle>
            <DialogDescription>
              Szczegóły dla adresu {selectedDuplicate?.label}
            </DialogDescription>
          </DialogHeader>

          {selectedDuplicate && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Łączna liczba wystąpień: {selectedDuplicate.count}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Źródło</TableHead>
                    <TableHead>Właściciel</TableHead>
                    <TableHead>Wystąpienia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDuplicate.details.map((detail, index) => (
                    <TableRow key={`${detail.source}-${index}`}>
                      <TableCell>{detail.source === 'company' ? 'Firma' : 'Zamieszkała'}</TableCell>
                      <TableCell>{detail.owner || '-'}</TableCell>
                      <TableCell>{detail.occurrences}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
