import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Plus, Search, MapPin, Edit, Trash2, Filter, ArrowUpDown, Upload, Download, BarChart3, Building2, Leaf, Link2, Tag, Recycle, GlassWater, Flame, Newspaper, Package } from 'lucide-react';
import { adminService } from '@/api/services/admin.service';
import { AdminAddress } from '@/types/admin';
import { WASTE_OPTIONS } from '@/constants/waste';
import { WasteType } from '@/types/waste';
import { APP_CONFIG } from '@/constants/config';
import { toast } from 'sonner';
import { applyApiFieldErrors } from '@/utils/formErrors';
import { normalizeCityName } from '@/utils/addressKeys';
import { ROUTES, getAdminAddressStatsPath } from '@/constants/routes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const wasteEnum = z.enum(WASTE_OPTIONS.map(option => option.id) as [WasteType, ...WasteType[]]);
const addressSchema = z.object({
  street: z.string().min(2, 'Podaj ulicę'),
  number: z.string().min(1, 'Podaj numer'),
  city: z.string().min(2, 'Podaj miasto'),
  postalCode: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  composting: z.string().optional().or(z.literal('')),
  wasteTypes: z.array(wasteEnum).min(1, 'Wybierz przynajmniej jeden typ odpadu'),
  declaredContainers: z
    .array(
      z.object({
        name: z.string().optional().or(z.literal('')),
        count: z.coerce.number().min(0),
        frequency: z.string().optional().or(z.literal('')),
      })
    )
    .optional()
    .default([]),
  active: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export const AddressesManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [wasteFilter, setWasteFilter] = useState<WasteType[]>([]);
  const [wasteGroupFilter, setWasteGroupFilter] = useState<
    Array<'bio' | 'glass' | 'ash' | 'mixed' | 'paper' | 'plastic'>
  >([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [compostFilter, setCompostFilter] = useState<'ALL' | 'YES' | 'NO' | 'UNKNOWN'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMPANY' | 'RESIDENTIAL'>('ALL');
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<
    'ALL' | 'COMPANY_WITH_OWNER' | 'COMPANY_WITHOUT_OWNER' | 'RESIDENTIAL'
  >('ALL');
  const [declarationFilter, setDeclarationFilter] = useState<'ALL' | 'WITH' | 'WITHOUT' | 'MULTI'>('ALL');
  const [dataStatusFilter, setDataStatusFilter] = useState<string[]>([]);
  const [streetFilter, setStreetFilter] = useState('ALL');
  const [numberFrom, setNumberFrom] = useState('');
  const [numberTo, setNumberTo] = useState('');
  const [routeCountFilter, setRouteCountFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [updatedFrom, setUpdatedFrom] = useState('');
  const [updatedTo, setUpdatedTo] = useState('');
  const [importedFrom, setImportedFrom] = useState('');
  const [importedTo, setImportedTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'street' | 'city' | 'createdAt' | 'number'>('street');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.UI.ITEMS_PER_PAGE);
  const [addresses, setAddresses] = useState<AdminAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AdminAddress | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      number: '',
      city: '',
      postalCode: '',
      notes: '',
      composting: '',
      wasteTypes: [
        'mixed',
        'mixed-240',
        'bio-green',
        'bio-green-240',
        'bio-kitchen',
        'bio-kitchen-240',
      ],
      declaredContainers: [],
      active: true,
    },
  });

  useEffect(() => {
    loadAddresses();
  }, [
    searchQuery,
    cityFilter,
    wasteFilter,
    wasteGroupFilter,
    statusFilter,
    compostFilter,
    assignmentFilter,
    typeFilter,
    ownerTypeFilter,
    declarationFilter,
    dataStatusFilter,
    streetFilter,
    numberFrom,
    numberTo,
    routeCountFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    importedFrom,
    importedTo,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    cityFilter,
    wasteFilter,
    wasteGroupFilter,
    statusFilter,
    compostFilter,
    assignmentFilter,
    typeFilter,
    ownerTypeFilter,
    declarationFilter,
    dataStatusFilter,
    streetFilter,
    numberFrom,
    numberTo,
    routeCountFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    importedFrom,
    importedTo,
    sortBy,
    sortOrder,
    pageSize,
  ]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAddresses({
        search: searchQuery || undefined,
        city: cityFilter === 'ALL' ? undefined : cityFilter,
        wasteTypes: wasteFilter.length > 0 ? wasteFilter.join(',') : undefined,
        wasteGroups: wasteGroupFilter.length > 0 ? wasteGroupFilter.join(',') : undefined,
        street: streetFilter === 'ALL' ? undefined : streetFilter,
        active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        composting:
          compostFilter === 'ALL'
            ? undefined
            : compostFilter === 'YES'
              ? 'yes'
              : compostFilter === 'NO'
                ? 'no'
                : 'unknown',
        unassigned: assignmentFilter === 'UNASSIGNED' ? true : undefined,
        routeCount: routeCountFilter ? Number(routeCountFilter) : undefined,
        declarationStatus:
          declarationFilter === 'ALL'
            ? undefined
            : declarationFilter === 'WITH'
              ? 'with'
              : declarationFilter === 'WITHOUT'
                ? 'without'
                : 'multi',
        dataStatus: dataStatusFilter.length > 0 ? dataStatusFilter.join(',') : undefined,
        ownerType:
          ownerTypeFilter === 'ALL'
            ? undefined
            : ownerTypeFilter === 'COMPANY_WITH_OWNER'
              ? 'company_with_owner'
              : ownerTypeFilter === 'COMPANY_WITHOUT_OWNER'
                ? 'company_without_owner'
                : 'residential',
        numberFrom: numberFrom ? Number(numberFrom) : undefined,
        numberTo: numberTo ? Number(numberTo) : undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        updatedFrom: updatedFrom || undefined,
        updatedTo: updatedTo || undefined,
        importedFrom: importedFrom || undefined,
        importedTo: importedTo || undefined,
        sortBy,
        sortOrder,
      });
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      toast.error('Nie udało się pobrać adresów');
    } finally {
      setIsLoading(false);
    }
  };

  const cityOptions = useMemo(() => {
    const uniqueCities = new Set(addresses.map(address => address.city));
    return Array.from(uniqueCities.values());
  }, [addresses]);

  const streetOptions = useMemo(() => {
    const uniqueStreets = new Set(addresses.map(address => address.street));
    return Array.from(uniqueStreets.values());
  }, [addresses]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (cityFilter !== 'ALL') count += 1;
    if (wasteFilter.length > 0) count += 1;
    if (wasteGroupFilter.length > 0) count += 1;
    if (statusFilter !== 'ALL') count += 1;
    if (compostFilter !== 'ALL') count += 1;
    if (assignmentFilter !== 'ALL') count += 1;
    if (typeFilter !== 'ALL') count += 1;
    if (ownerTypeFilter !== 'ALL') count += 1;
    if (declarationFilter !== 'ALL') count += 1;
    if (dataStatusFilter.length > 0) count += 1;
    if (streetFilter !== 'ALL') count += 1;
    if (numberFrom || numberTo) count += 1;
    if (routeCountFilter) count += 1;
    if (createdFrom || createdTo) count += 1;
    if (updatedFrom || updatedTo) count += 1;
    if (importedFrom || importedTo) count += 1;
    return count;
  }, [
    searchQuery,
    cityFilter,
    wasteFilter,
    wasteGroupFilter,
    statusFilter,
    compostFilter,
    assignmentFilter,
    typeFilter,
    ownerTypeFilter,
    declarationFilter,
    dataStatusFilter,
    streetFilter,
    numberFrom,
    numberTo,
    routeCountFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    importedFrom,
    importedTo,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSearchDraft('');
    setCityFilter('ALL');
    setWasteFilter([]);
    setWasteGroupFilter([]);
    setStatusFilter('ALL');
    setCompostFilter('ALL');
    setAssignmentFilter('ALL');
    setTypeFilter('ALL');
    setOwnerTypeFilter('ALL');
    setDeclarationFilter('ALL');
    setDataStatusFilter([]);
    setStreetFilter('ALL');
    setNumberFrom('');
    setNumberTo('');
    setRouteCountFilter('');
    setCreatedFrom('');
    setCreatedTo('');
    setUpdatedFrom('');
    setUpdatedTo('');
    setImportedFrom('');
    setImportedTo('');
    setSortBy('street');
    setSortOrder('asc');
    setPage(1);
  };

  const visibleWasteOptions = useMemo(() => WASTE_OPTIONS, []);

  const wasteFilterLabel = useMemo(() => {
    if (wasteFilter.length === 0) return 'Wszystkie typy';
    const names = wasteFilter
      .map(id => WASTE_OPTIONS.find(option => option.id === id)?.name || id)
      .filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }, [wasteFilter]);

  const dataStatusLabel = useMemo(() => {
    if (dataStatusFilter.length === 0) return 'Wszystkie';
    const labels: Record<string, string> = {
      missing_number: 'Brak numeru',
      missing_postal: 'Brak kodu',
      missing_composting: 'Brak kompost.',
      suspicious: 'Podejrzany',
    };
    const names = dataStatusFilter.map(item => labels[item] || item);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }, [dataStatusFilter]);

  const wasteGroupLabel = useMemo(() => {
    if (wasteGroupFilter.length === 0) return 'Wszystkie';
    const labels: Record<string, string> = {
      bio: 'Bio',
      glass: 'Szkło',
      ash: 'Popiół',
      mixed: 'Zmieszane',
      paper: 'Papier',
      plastic: 'Plastik',
    };
    const names = wasteGroupFilter.map(item => labels[item] || item);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }, [wasteGroupFilter]);

  const sortedAddresses = useMemo(() => {
    const list = [...addresses].filter(address => {
      if (typeFilter === 'ALL') return true;
      const isCompany = Boolean(address.notes?.includes('Typ: Firma') || address.notes?.includes('Właściciel:'));
      return typeFilter === 'COMPANY' ? isCompany : !isCompany;
    });

    const parseAddressNumber = (value: string) => {
      const match = value.trim().match(/^(\d+)\s*([a-zA-Z]*)/);
      if (!match) return { number: Number.MAX_SAFE_INTEGER, suffix: value };
      return {
        number: Number(match[1]),
        suffix: (match[2] || '').toLowerCase(),
      };
    };

    list.sort((a, b) => {
      if (sortBy === 'street') {
        const streetCompare = a.street.localeCompare(b.street, 'pl');
        if (streetCompare !== 0) return streetCompare * (sortOrder === 'desc' ? -1 : 1);
        const aNum = parseAddressNumber(a.number);
        const bNum = parseAddressNumber(b.number);
        if (aNum.number !== bNum.number) {
          return (aNum.number - bNum.number) * (sortOrder === 'desc' ? -1 : 1);
        }
        return aNum.suffix.localeCompare(bNum.suffix, 'pl') * (sortOrder === 'desc' ? -1 : 1);
      }
      if (sortBy === 'number') {
        const aNum = parseAddressNumber(a.number);
        const bNum = parseAddressNumber(b.number);
        if (aNum.number !== bNum.number) {
          return (aNum.number - bNum.number) * (sortOrder === 'desc' ? -1 : 1);
        }
        return aNum.suffix.localeCompare(bNum.suffix, 'pl') * (sortOrder === 'desc' ? -1 : 1);
      }

      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const direction = sortOrder === 'desc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, 'pl') * direction;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
    return list;
  }, [addresses, sortBy, sortOrder, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedAddresses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAddresses = sortedAddresses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isCompanyAddress = (address: AdminAddress) =>
    Boolean(address.notes?.includes('Typ: Firma') || address.notes?.includes('Właściciel:'));

  const mapDeclaredNameToType = (name?: string): WasteType | null => {
    if (!name) return null;
    const normalized = name.toLowerCase();
    let base:
      | 'mixed'
      | 'bio-green'
      | 'bio-kitchen'
      | 'paper'
      | 'plastic'
      | 'glass-clear'
      | 'glass-colored'
      | 'ash'
      | null = null;

    if (normalized.includes('resztkowe') || normalized.includes('zmiesz')) base = 'mixed';
    if (normalized.includes('bio')) {
      base = normalized.includes('kuchen') ? 'bio-kitchen' : 'bio-green';
    }
    if (normalized.includes('papier')) base = 'paper';
    if (normalized.includes('plastik') || normalized.includes('metal')) base = 'plastic';
    if (normalized.includes('szkło') || normalized.includes('szklo')) {
      base = normalized.includes('bezbarw') ? 'glass-clear' : 'glass-colored';
    }
    if (normalized.includes('popiół') || normalized.includes('popiol')) base = 'ash';

    if (!base) return null;
    const sizeMatch = normalized.match(/\b(\d{2,4})\s*l\b|\b(\d{2,4})l\b/);
    const sizeValue = sizeMatch?.[1] || sizeMatch?.[2];
    const size = sizeValue ? Number(sizeValue) : undefined;
    if (size === 1100) return `${base}-1100` as WasteType;
    if (size === 240) return `${base}-240` as WasteType;
    return base as WasteType;
  };

  const notesValue = form.watch('notes');
  const declaredContainersValue = form.watch('declaredContainers');
  const selectedWasteTypes = form.watch('wasteTypes');
  const showDeclaredContainers =
    Boolean(notesValue?.includes('Typ: Firma') || notesValue?.includes('Właściciel:')) ||
    Boolean(editingAddress && isCompanyAddress(editingAddress));

  const getDeclaredCountForType = (typeId: WasteType) => {
    const option = WASTE_OPTIONS.find(item => item.id === typeId);
    if (!option) return 0;
    const entry = declaredContainersValue?.find(
      item =>
        item.type === typeId ||
        item.name === option.name ||
        mapDeclaredNameToType(item.name) === typeId
    );
    return entry?.count ?? 0;
  };

  const updateDeclaredCountForType = (typeId: WasteType, nextValue: number) => {
    const option = WASTE_OPTIONS.find(item => item.id === typeId);
    if (!option) return;
    const current = declaredContainersValue ? [...declaredContainersValue] : [];
    const index = current.findIndex(item => item.type === typeId || item.name === option.name);
    if (nextValue <= 0) {
      if (index !== -1) {
        current.splice(index, 1);
      }
    } else if (index === -1) {
      current.push({ type: typeId, name: option.name, count: nextValue });
    } else {
      current[index] = {
        ...current[index],
        type: typeId,
        name: option.name,
        count: nextValue,
      };
    }
    form.setValue('declaredContainers', current, { shouldDirty: true });
  };

  const getNoteValue = (notes: string | undefined, prefix: string) => {
    if (!notes) return '';
    const line = notes.split('\n').find(item => item.trim().startsWith(prefix));
    if (!line) return '';
    return line.replace(prefix, '').trim();
  };

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[,.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const expandStreetAbbreviations = (value: string) =>
    value
      .replace(/\b(ul|ulica)\b/g, 'ulica')
      .replace(/\b(pl|plac)\b/g, 'plac')
      .replace(/\b(al|aleja|aleje)\b/g, 'aleja')
      .replace(/\b(os|osiedle)\b/g, 'osiedle');

  const normalizeAddressSearch = (value: string) => {
    const normalized = expandStreetAbbreviations(normalizeText(value));
    return normalized.replace(/(\d)([a-z])/g, '$1 $2').trim();
  };

  const suggestions = useMemo(() => {
    const query = normalizeAddressSearch(searchDraft);
    if (query.length < 3) return [];
    const unique = new Map<string, string>();
    addresses.forEach(address => {
      const label = `${address.street} ${address.number}, ${address.city}`;
      const normalized = normalizeAddressSearch(label);
      if (normalized.includes(query) && !unique.has(label)) {
        unique.set(label, label);
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [addresses, searchDraft]);

  const applySearch = () => {
    const trimmed = searchDraft.trim();
    setSearchQuery(trimmed);
  };

  const formatAddressLabel = (address: AdminAddress) => {
    const postalPart = address.postalCode ? `${address.postalCode} ` : '';
    return `${postalPart}${address.city}, ${address.street} ${address.number}`.trim();
  };

  const escapeCsvValue = (value: string | number | undefined | null) => {
    const stringValue = value === undefined || value === null ? '' : String(value);
    if (/[;"\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const buildCsv = (rows: string[][]) => {
    const content = rows.map(row => row.map(escapeCsvValue).join(';')).join('\n');
    return `\ufeff${content}`;
  };

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = (mode: 'all' | 'company' | 'residential' = 'all') => {
    const companies = sortedAddresses.filter(isCompanyAddress);
    const residential = sortedAddresses.filter(address => !isCompanyAddress(address));
    const exportCompanies = mode === 'all' || mode === 'company';
    const exportResidential = mode === 'all' || mode === 'residential';
    const dateStamp = new Date().toISOString().split('T')[0];

    if ((exportCompanies && companies.length === 0) || (exportResidential && residential.length === 0)) {
      toast.error('Brak adresów do eksportu');
      return;
    }

    if (exportCompanies && companies.length > 0) {
      const rows: string[][] = [
        ['Lp.', 'Właściciel', 'Adres', 'Pojemnik', 'Liczba', 'Częstotliwość'],
      ];
      let index = 1;
      companies.forEach(address => {
        const owner = getNoteValue(address.notes, 'Właściciel:');
        const label = formatAddressLabel(address);
        const containers = address.declaredContainers || [];
        if (containers.length === 0) {
          rows.push([String(index), owner, label, '', '', '']);
          index += 1;
          return;
        }
        containers.forEach(container => {
          rows.push([
            String(index),
            owner,
            label,
            container.name,
            String(container.count ?? ''),
            container.frequency || '',
          ]);
          index += 1;
        });
      });
      downloadCsv(`adresy_firmy_${dateStamp}.csv`, buildCsv(rows));
    }

    if (exportResidential && residential.length > 0) {
      const rows: string[][] = [
        ['Lp.', 'Nieruchomość', 'Numer', 'Zmiana od', 'Liczba mieszkańców', 'Stawka', 'Kompostownik'],
      ];
      let index = 1;
      residential.forEach(address => {
        const label = formatAddressLabel(address);
        const declarationNumber = getNoteValue(address.notes, 'Numer deklaracji:');
        const changeFrom = getNoteValue(address.notes, 'Zmiana od:');
        const residents = getNoteValue(address.notes, 'Liczba mieszkańców:');
        const rate = getNoteValue(address.notes, 'Stawka:');
        const compost = address.composting || getNoteValue(address.notes, 'Kompostownik:');
        rows.push([
          String(index),
          label,
          declarationNumber,
          changeFrom,
          residents,
          rate,
          compost,
        ]);
        index += 1;
      });
      downloadCsv(`adresy_mieszkalne_${dateStamp}.csv`, buildCsv(rows));
    }

    toast.success('Eksport zakończony');
  };

  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Strona {currentPage} z {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
        >
          Poprzednia
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
        >
          Następna
        </Button>
      </div>
    </div>
  );

  const handleOpenCreate = () => {
    setEditingAddress(null);
    form.reset({
      street: '',
      number: '',
      city: '',
      postalCode: '',
      notes: '',
      composting: '',
      wasteTypes: [
        'mixed',
        'mixed-240',
        'bio-green',
        'bio-green-240',
        'bio-kitchen',
        'bio-kitchen-240',
      ],
      declaredContainers: [],
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (address: AdminAddress) => {
    setEditingAddress(address);
    const normalizedDeclared =
      address.declaredContainers?.map(item => {
        const mappedType = item.type ?? mapDeclaredNameToType(item.name);
        if (!mappedType) return item;
        const option = WASTE_OPTIONS.find(optionItem => optionItem.id === mappedType);
        return {
          ...item,
          type: mappedType,
          name: option?.name || item.name,
        };
      }) || [];
    form.reset({
      street: address.street,
      number: address.number,
      city: address.city,
      postalCode: address.postalCode || '',
      notes: address.notes || '',
      composting: address.composting || '',
      wasteTypes: address.wasteTypes,
      declaredContainers: normalizedDeclared,
      active: address.active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: AddressFormValues) => {
    try {
      const declaredContainers = values.wasteTypes
        .map(typeId => {
          const option = WASTE_OPTIONS.find(item => item.id === typeId);
          const entry = values.declaredContainers?.find(
            item => item.type === typeId || item.name === option?.name
          );
          const count = Number(entry?.count ?? 0) || 0;
          if (!option || count <= 0) return null;
          return {
            type: typeId,
            name: option.name,
            count,
            frequency: entry?.frequency?.trim() || undefined,
          };
        })
        .filter(Boolean);
      if (editingAddress) {
        await adminService.updateAddress(editingAddress.id, {
          street: values.street,
          number: values.number,
          city: normalizeCityName(values.city),
          postalCode: values.postalCode || undefined,
          notes: values.notes || undefined,
          composting: values.composting || undefined,
          wasteTypes: values.wasteTypes,
          declaredContainers,
          active: values.active,
        });
        toast.success('Zaktualizowano adres');
      } else {
        await adminService.createAddress({
          street: values.street,
          number: values.number,
          city: normalizeCityName(values.city),
          postalCode: values.postalCode || undefined,
          notes: values.notes || undefined,
          composting: values.composting || undefined,
          wasteTypes: values.wasteTypes,
          declaredContainers,
          active: values.active,
        });
        toast.success('Dodano adres');
      }

      setIsDialogOpen(false);
      await loadAddresses();
    } catch (error: any) {
      console.error('Address save failed:', error);
      const applied = applyApiFieldErrors(error, form.setError);
      toast.error(applied ? 'Popraw pola oznaczone błędem' : (error?.message || 'Nie udało się zapisać adresu'));
    }
  };

  const handleDelete = async (address: AdminAddress) => {
    const confirmed = window.confirm(`Czy na pewno usunąć ${address.street} ${address.number}?`);
    if (!confirmed) return;

    try {
      await adminService.deleteAddress(address.id);
      toast.success('Usunięto adres');
      await loadAddresses();
    } catch (error: any) {
      console.error('Address delete failed:', error);
      toast.error(error?.message || 'Nie udało się usunąć adresu');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Zarządzanie adresami" 
        subtitle={`${addresses.length} adresów`}
        onBack={() => navigate(ROUTES.ADMIN.DASHBOARD)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {/* Search + actions */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              {searchQuery.trim() && (
                <span className="absolute left-10 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  aktywne
                </span>
              )}
            <Input
                type="search"
                placeholder="Szukaj: miasto, ulica, numer, kod pocztowy..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applySearch();
                }
              }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className={searchQuery.trim() ? 'pl-24' : 'pl-10'}
              />
            <Button
              type="button"
              variant="default"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3"
              onClick={applySearch}
            >
              Szukaj
            </Button>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-card shadow-lg">
                  {suggestions.map(item => (
                    <button
                      key={item}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
                      onMouseDown={() => {
                      setSearchDraft(item);
                      setSearchQuery(item);
                        setShowSuggestions(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setSearchDraft('');
                  setSearchQuery('');
                }}
              >
                Resetuj wyszukiwanie
              </Button>
              <Button className="gap-2" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" />
                Dodaj adres
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(ROUTES.ADMIN.IMPORT)}
              >
                <Upload className="w-4 h-4" />
                Importuj
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportCsv('all')}>
              <Download className="w-4 h-4" />
              Eksport CSV (wszystkie)
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportCsv('company')}>
              <Download className="w-4 h-4" />
              Eksport tylko firmy
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportCsv('residential')}>
              <Download className="w-4 h-4" />
              Eksport tylko mieszkalne
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filtry
              {activeFiltersCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Miasto
              </span>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Miasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie miasta</SelectItem>
                  {cityOptions.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Typ odpadu
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-52 justify-between">
                    <span className="truncate text-left">{wasteFilterLabel}</span>
                    <span className="text-xs text-muted-foreground">{wasteFilter.length}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-sm font-medium">Typy odpadów</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setWasteFilter([])}
                    >
                      Wyczyść
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {WASTE_OPTIONS.map(option => {
                      const isChecked = wasteFilter.includes(option.id);
                      return (
                        <label key={option.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setWasteFilter(prev =>
                                checked
                                  ? [...prev, option.id]
                                  : prev.filter(item => item !== option.id)
                              );
                            }}
                          />
                          <span>{option.icon}</span>
                          <span>{option.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Status
              </span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie</SelectItem>
                  <SelectItem value="ACTIVE">Aktywne</SelectItem>
                  <SelectItem value="INACTIVE">Nieaktywne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" />
                Kompostownik
              </span>
              <Select value={compostFilter} onValueChange={(value) => setCompostFilter(value as typeof compostFilter)}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Kompostownik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie</SelectItem>
                  <SelectItem value="YES">Tak</SelectItem>
                  <SelectItem value="NO">Nie</SelectItem>
                  <SelectItem value="UNKNOWN">Brak danych</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                Przypisanie
              </span>
              <Select value={assignmentFilter} onValueChange={(value) => setAssignmentFilter(value as typeof assignmentFilter)}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Przypisanie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie</SelectItem>
                  <SelectItem value="UNASSIGNED">Nieprzypisane do trasy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Typ adresu
              </span>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Typ adresu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie</SelectItem>
                  <SelectItem value="COMPANY">Tylko firmy</SelectItem>
                  <SelectItem value="RESIDENTIAL">Tylko mieszkalne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                Zaawansowane filtry
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(prev => !prev)}
              >
                {showAdvancedFilters ? 'Ukryj' : 'Pokaż'}
              </Button>
            </div>

            {showAdvancedFilters && (
              <>
                <div className="mt-3 flex flex-col md:flex-row flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Ulica
                </span>
                <Select value={streetFilter} onValueChange={setStreetFilter}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Ulica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Wszystkie ulice</SelectItem>
                    {streetOptions.map(street => (
                      <SelectItem key={street} value={street}>
                        {street}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Numer (od-do)</span>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Od"
                    value={numberFrom}
                    onChange={(e) => setNumberFrom(e.target.value)}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Do"
                    value={numberTo}
                    onChange={(e) => setNumberTo(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Typ właściciela</span>
                <Select value={ownerTypeFilter} onValueChange={(value) => setOwnerTypeFilter(value as typeof ownerTypeFilter)}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Typ właściciela" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Wszystkie</SelectItem>
                    <SelectItem value="COMPANY_WITH_OWNER">Firma z właścicielem</SelectItem>
                    <SelectItem value="COMPANY_WITHOUT_OWNER">Firma bez właściciela</SelectItem>
                    <SelectItem value="RESIDENTIAL">Mieszkalne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Typ deklaracji</span>
                <Select value={declarationFilter} onValueChange={(value) => setDeclarationFilter(value as typeof declarationFilter)}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Typ deklaracji" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Wszystkie</SelectItem>
                    <SelectItem value="WITH">Z deklaracją</SelectItem>
                    <SelectItem value="WITHOUT">Bez deklaracji</SelectItem>
                    <SelectItem value="MULTI">Wielodeklaracyjne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Liczba tras</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="np. 2"
                  value={routeCountFilter}
                  onChange={(e) => setRouteCountFilter(e.target.value)}
                  className="w-36"
                />
              </div>
            </div>

                <div className="mt-3 flex flex-col md:flex-row flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Status danych</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-52 justify-between">
                      <span className="truncate text-left">{dataStatusLabel}</span>
                      <span className="text-xs text-muted-foreground">{dataStatusFilter.length}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm font-medium">Status danych</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setDataStatusFilter([])}
                      >
                        Wyczyść
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {[
                        { id: 'missing_number', label: 'Brak numeru' },
                        { id: 'missing_postal', label: 'Brak kodu' },
                        { id: 'missing_composting', label: 'Brak kompostownika' },
                        { id: 'suspicious', label: 'Podejrzany wpis' },
                      ].map(option => {
                        const isChecked = dataStatusFilter.includes(option.id);
                        return (
                          <label key={option.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setDataStatusFilter(prev =>
                                  checked
                                    ? [...prev, option.id]
                                    : prev.filter(item => item !== option.id)
                                );
                              }}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Zasięg odpadu</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-52 justify-between">
                      <span className="truncate text-left">{wasteGroupLabel}</span>
                      <span className="text-xs text-muted-foreground">{wasteGroupFilter.length}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm font-medium">Zasięg odpadu</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setWasteGroupFilter([])}
                      >
                        Wyczyść
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {[
                        { id: 'bio', label: 'Bio', icon: <Leaf className="w-4 h-4 text-success" /> },
                        { id: 'glass', label: 'Szkło', icon: <GlassWater className="w-4 h-4 text-sky-500" /> },
                        { id: 'ash', label: 'Popiół', icon: <Flame className="w-4 h-4 text-orange-500" /> },
                        { id: 'mixed', label: 'Zmieszane', icon: <Recycle className="w-4 h-4 text-muted-foreground" /> },
                        { id: 'paper', label: 'Papier', icon: <Newspaper className="w-4 h-4 text-yellow-600" /> },
                        { id: 'plastic', label: 'Plastik', icon: <Package className="w-4 h-4 text-indigo-500" /> },
                      ].map(option => {
                        const isChecked = wasteGroupFilter.includes(
                          option.id as 'bio' | 'glass' | 'ash' | 'mixed' | 'paper' | 'plastic'
                        );
                        return (
                          <label key={option.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setWasteGroupFilter(prev =>
                                  checked
                                    ? [...prev, option.id as 'bio' | 'glass' | 'ash' | 'mixed' | 'paper' | 'plastic']
                                    : prev.filter(item => item !== option.id)
                                );
                              }}
                            />
                            <span className="flex items-center gap-2">
                              {option.icon}
                              {option.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Utworzono (od-do)</span>
                <div className="flex gap-2">
                  <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
                  <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Ostatnia edycja (od-do)</span>
                <div className="flex gap-2">
                  <Input type="date" value={updatedFrom} onChange={(e) => setUpdatedFrom(e.target.value)} />
                  <Input type="date" value={updatedTo} onChange={(e) => setUpdatedTo(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Ostatni import (od-do)</span>
                <div className="flex gap-2">
                  <Input type="date" value={importedFrom} onChange={(e) => setImportedFrom(e.target.value)} />
                  <Input type="date" value={importedTo} onChange={(e) => setImportedTo(e.target.value)} />
                </div>
              </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpDown className="w-4 h-4" />
              Sortowanie i stronicowanie
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Sortuj po" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="street">Ulica</SelectItem>
                <SelectItem value="number">Numer adresu</SelectItem>
                <SelectItem value="city">Miasto</SelectItem>
                <SelectItem value="createdAt">Data dodania</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Kolejność" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Rosnąco</SelectItem>
                <SelectItem value="desc">Malejąco</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Na stronę" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / strona</SelectItem>
                <SelectItem value="20">20 / strona</SelectItem>
                <SelectItem value="50">50 / strona</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <PaginationControls />

        {isLoading && (
          <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Ładowanie adresów...</p>
          </div>
        )}

        <div className="space-y-3">
          {paginatedAddresses.map(address => (
            <div
              key={address.id}
              className="bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {address.street} {address.number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {address.city}{address.postalCode ? `, ${address.postalCode}` : ''}
                      </p>
                    </div>
                    {address.notes && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {address.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {address.wasteTypes.map(type => {
                        const option = WASTE_OPTIONS.find(item => item.id === type);
                        return (
                          <span
                            key={type}
                            className="px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/40 text-muted-foreground"
                          >
                            {option?.icon} {option?.name || type}
                          </span>
                        );
                      })}
                      {!address.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-destructive/10 text-destructive border-destructive/20">
                          Nieaktywny
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate(getAdminAddressStatsPath(address.id))}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Statystyki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleOpenEdit(address)}
                  >
                    <Edit className="w-4 h-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(address)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {paginatedAddresses.length === 0 && (
          <div className="bg-card rounded-2xl p-12 border border-border text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'Nie znaleziono adresów' : 'Brak adresów'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'Spróbuj zmienić kryteria wyszukiwania'
                : 'Dodaj pierwszy adres aby rozpocząć'}
            </p>
          </div>
        )}

        <PaginationControls />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edytuj adres' : 'Dodaj adres'}</DialogTitle>
            <DialogDescription>
              Podaj szczegóły adresu i przypisz typy odpadów.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notatki</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="composting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kompostownik</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? field.value : 'unknown'}
                          onValueChange={(value) =>
                            field.onChange(value === 'unknown' ? '' : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz wartość" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unknown">Brak danych</SelectItem>
                            <SelectItem value="Tak">Tak</SelectItem>
                            <SelectItem value="Nie">Nie</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="wasteTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typy odpadów</FormLabel>
                      <div className="grid gap-2 md:grid-cols-2">
                        {visibleWasteOptions.map(option => {
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

                {showDeclaredContainers && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Deklarowane pojemniki (firmy)</p>
                      <p className="text-xs text-muted-foreground">
                        Ustaw ilości tylko dla typów wybranych powyżej.
                      </p>
                    </div>
                    {selectedWasteTypes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Najpierw wybierz typy odpadów.</p>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        {selectedWasteTypes.map(typeId => {
                          const option = WASTE_OPTIONS.find(item => item.id === typeId);
                          if (!option) return null;
                          return (
                            <label
                              key={typeId}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                            >
                              <span className="flex items-center gap-2 text-foreground">
                                <span>{option.icon}</span>
                                {option.name}
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                className="w-24 text-right"
                                value={getDeclaredCountForType(typeId)}
                                onChange={(event) =>
                                  updateDeclaredCountForType(
                                    typeId,
                                    Number(event.target.value || 0)
                                  )
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="md:col-span-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit">
                  {editingAddress ? 'Zapisz zmiany' : 'Dodaj adres'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
