import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { adminService } from '@/api/services/admin.service';
import { AdminAddress, AdminRoute } from '@/types/admin';
import { ROUTES } from '@/constants/routes';
import { ArrowDown, ArrowUp, MoveRight, Filter, MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { applyApiFieldErrors } from '@/utils/formErrors';
import { buildAddressKey } from '@/utils/addressKeys';

const routeSchema = z.object({
  name: z.string().min(2, 'Podaj nazwę trasy'),
  addressIds: z.array(z.string()).min(1, 'Wybierz przynajmniej jeden adres'),
});

type RouteFormValues = z.infer<typeof routeSchema>;

type RouteDraft = RouteFormValues & { updatedAt: string };

export const RouteEditor = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(routeId);
  const [addresses, setAddresses] = useState<AdminAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressFilter, setAddressFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'unassigned'>('all');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [streetFilter, setStreetFilter] = useState('ALL');
  const [declarationFilter, setDeclarationFilter] = useState<'ALL' | 'WITH' | 'WITHOUT' | 'MULTI'>('ALL');
  const [dataStatusFilter, setDataStatusFilter] = useState<string[]>([]);
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
  const [assignedAddressIds, setAssignedAddressIds] = useState<string[]>([]);
  const [routeCounts, setRouteCounts] = useState<Record<string, number>>({});
  const [movedMap, setMovedMap] = useState<Record<string, { from: number; to: number }>>({});
  const [draftInfo, setDraftInfo] = useState<RouteDraft | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [publicationStatus, setPublicationStatus] = useState<'DRAFT' | 'PUBLISHED'>(
    isEdit ? 'PUBLISHED' : 'DRAFT'
  );
  const saveTimer = useRef<number | null>(null);

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      addressIds: [],
    },
  });
  const selectedAddressIds = form.watch('addressIds');

  const draftStorageKey = `admin.routeDraft.${routeId ?? 'new'}`;

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RouteDraft;
      if (!parsed?.name && (!parsed?.addressIds || parsed.addressIds.length === 0)) {
        return null;
      }
      return parsed;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  };

  const saveDraft = (values: RouteFormValues) => {
    try {
      const payload: RouteDraft = {
        ...values,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      setDraftInfo(payload);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setDraftInfo(null);
    setShowDraftPrompt(false);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [addressData, routeData] = await Promise.all([
          adminService.getAddresses(),
          adminService.getRoutes(),
        ]);
        setAddresses(addressData);
        const assignedIds = routeData
          .filter(item => item.id !== routeId)
          .flatMap(item => item.addressIds || []);
        setAssignedAddressIds(assignedIds);
        const countsMap = new Map<string, number>();
        routeData
          .filter(item => item.id !== routeId)
          .forEach(route => {
            (route.addressIds || []).forEach(addressId => {
              countsMap.set(addressId, (countsMap.get(addressId) || 0) + 1);
            });
          });
        setRouteCounts(Object.fromEntries(countsMap));
        if (isEdit) {
          const route = routeData.find(item => item.id === routeId);
          if (!route) {
            toast.error('Nie znaleziono trasy');
            navigate(ROUTES.ADMIN.ROUTES);
            return;
          }
          form.reset({
            name: route.name,
            addressIds: route.addressIds,
          });
          setPublicationStatus(route.publicationStatus ?? 'PUBLISHED');
        }

        const draft = loadDraft();
        if (draft) {
          setDraftInfo(draft);
          setShowDraftPrompt(true);
        }
      } catch (error) {
        console.error('Failed to load route data:', error);
        toast.error('Nie udało się pobrać danych');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [form, isEdit, navigate, routeId]);

  useEffect(() => {
    const subscription = form.watch(values => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
      saveTimer.current = window.setTimeout(() => {
        const hasContent =
          Boolean(values.name?.trim()) || Boolean(values.addressIds?.length);
        if (hasContent) {
          saveDraft({
            name: values.name || '',
            addressIds: values.addressIds || [],
          });
        }
      }, 800);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [form]);

  const cityOptions = useMemo(() => {
    const unique = new Set(addresses.map(address => address.city));
    return Array.from(unique.values());
  }, [addresses]);

  const streetOptions = useMemo(() => {
    const unique = new Set(addresses.map(address => address.street));
    return Array.from(unique.values());
  }, [addresses]);

  const normalizeNotes = (notes?: string | null) => (typeof notes === 'string' ? notes : '');

  const extractOwnerFromNotes = (notes?: string | null) => {
    const safeNotes = normalizeNotes(notes);
    if (!safeNotes) return '';
    const line = safeNotes.split('\n').find(item => item.startsWith('Właściciel:'));
    if (!line) return '';
    return line.replace('Właściciel:', '').trim();
  };

  const hasDeclarationFromNotes = (notes?: string | null) =>
    normalizeNotes(notes).includes('Numer deklaracji:');

  const parseAddressNumber = (value?: string) => {
    if (!value) return null;
    const match = value.trim().match(/^(\d+)/);
    if (!match) return null;
    return Number(match[1]);
  };

  const parseDateParam = (value?: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const addressKeyCounts = useMemo(() => {
    const map = new Map<string, number>();
    addresses.forEach(address => {
      const key = buildAddressKey({
        street: address.street,
        number: address.number,
        city: address.city,
        postalCode: address.postalCode,
      });
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [addresses]);

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

  const filteredAddresses = useMemo(() => {
    const search = addressSearch.trim().toLowerCase();
    let filtered = !search
      ? addresses
      : addresses.filter(address => {
          const street = String(address.street || '').toLowerCase();
          const city = String(address.city || '').toLowerCase();
          const number = String(address.number || '').toLowerCase();
          const postal = String(address.postalCode || '').toLowerCase();
          return (
            street.includes(search) ||
            city.includes(search) ||
            number.includes(search) ||
            postal.includes(search)
          );
        });
    if (addressFilter === 'active') {
      filtered = filtered.filter(address => address.active);
    }
    if (addressFilter === 'inactive') {
      filtered = filtered.filter(address => !address.active);
    }
    if (assignmentFilter === 'unassigned') {
      const assignedSet = new Set(assignedAddressIds);
      filtered = filtered.filter(
        address => !assignedSet.has(address.id) || selectedAddressIds.includes(address.id)
      );
    }
    if (cityFilter !== 'ALL') {
      filtered = filtered.filter(address => address.city === cityFilter);
    }
    if (streetFilter !== 'ALL') {
      filtered = filtered.filter(address => address.street === streetFilter);
    }
    if (declarationFilter !== 'ALL') {
      filtered = filtered.filter(address => {
        const hasDeclaration = hasDeclarationFromNotes(address.notes);
        const key = buildAddressKey({
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode,
        });
        const isMulti = (addressKeyCounts.get(key) || 0) > 1;
        if (declarationFilter === 'WITH') return hasDeclaration;
        if (declarationFilter === 'WITHOUT') return !hasDeclaration;
        if (declarationFilter === 'MULTI') return isMulti;
        return true;
      });
    }
    if (dataStatusFilter.length > 0) {
      filtered = filtered.filter(address => {
        const missingNumber = !address.number || address.number.trim().length === 0;
        const missingPostal = !address.postalCode || address.postalCode.trim().length === 0;
        const missingCompost = !address.composting || address.composting.trim().length === 0;
        const suspicious =
          !address.street || address.street.trim().length < 2 ||
          !address.city || address.city.trim().length < 2 ||
          missingNumber ||
          !/\d/.test(address.number || '');
        return dataStatusFilter.some(status => {
          if (status === 'missing_number') return missingNumber;
          if (status === 'missing_postal') return missingPostal;
          if (status === 'missing_composting') return missingCompost;
          if (status === 'suspicious') return suspicious;
          return false;
        });
      });
    }
    if (routeCountFilter) {
      const expected = Number(routeCountFilter);
      if (!Number.isNaN(expected)) {
        filtered = filtered.filter(address => (routeCounts[address.id] || 0) === expected);
      }
    }
    if (numberFrom || numberTo) {
      const from = numberFrom ? Number(numberFrom) : undefined;
      const to = numberTo ? Number(numberTo) : undefined;
      filtered = filtered.filter(address => {
        const value = parseAddressNumber(address.number);
        if (value === null) return false;
        if (from !== undefined && value < from) return false;
        if (to !== undefined && value > to) return false;
        return true;
      });
    }
    if (createdFrom || createdTo) {
      const from = parseDateParam(createdFrom);
      const to = parseDateParam(createdTo);
      filtered = filtered.filter(address => {
        if (!address.createdAt) return false;
        const date = new Date(address.createdAt);
        if (from && date < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (date > end) return false;
        }
        return true;
      });
    }
    if (updatedFrom || updatedTo) {
      const from = parseDateParam(updatedFrom);
      const to = parseDateParam(updatedTo);
      filtered = filtered.filter(address => {
        if (!address.updatedAt) return false;
        const date = new Date(address.updatedAt);
        if (from && date < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (date > end) return false;
        }
        return true;
      });
    }
    if (importedFrom || importedTo) {
      const from = parseDateParam(importedFrom);
      const to = parseDateParam(importedTo);
      filtered = filtered.filter(address => {
        if (!address.importedAt) return false;
        const date = new Date(address.importedAt);
        if (from && date < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (date > end) return false;
        }
        return true;
      });
    }
    return [...filtered].sort((a, b) => Number(b.active) - Number(a.active));
  }, [
    addresses,
    addressSearch,
    addressFilter,
    assignmentFilter,
    assignedAddressIds,
    selectedAddressIds,
    cityFilter,
    streetFilter,
    declarationFilter,
    dataStatusFilter,
    numberFrom,
    numberTo,
    routeCountFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    importedFrom,
    importedTo,
    routeCounts,
    addressKeyCounts,
  ]);

  const availableActive = useMemo(
    () => filteredAddresses.filter(address => address.active),
    [filteredAddresses]
  );
  const availableInactive = useMemo(
    () => filteredAddresses.filter(address => !address.active),
    [filteredAddresses]
  );

  const inactiveSelectedCount = useMemo(() => {
    if (!addresses.length) return 0;
    const selected = new Set(form.getValues('addressIds'));
    return addresses.filter(address => selected.has(address.id) && !address.active).length;
  }, [addresses, form]);

  const isCompanyAddress = (address: AdminAddress) => {
    const safeNotes = normalizeNotes(address.notes);
    return Boolean(safeNotes.includes('Typ: Firma') || safeNotes.includes('Właściciel:'));
  };

  const moveAddress = (fromIndex: number, toIndex: number) => {
    const nextIds = [...form.getValues('addressIds')];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= nextIds.length || toIndex >= nextIds.length) {
      return;
    }
    const [moved] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, moved);
    form.setValue('addressIds', nextIds, { shouldDirty: true });
    setMovedMap(prev => ({
      ...prev,
      [moved]: { from: fromIndex, to: toIndex },
    }));
  };

  const handleSubmit = async (values: RouteFormValues) => {
    try {
      if (isEdit && routeId) {
        await adminService.updateRoute(routeId, {
          ...values,
          publicationStatus: 'PUBLISHED',
        });
        toast.success('Zapisano i opublikowano trasę');
      } else {
        await adminService.createRoute({
          ...values,
          publicationStatus: 'PUBLISHED',
        });
        toast.success('Dodano i opublikowano trasę');
      }
      setPublicationStatus('PUBLISHED');
      clearDraft();
      navigate(ROUTES.ADMIN.ROUTES);
    } catch (error: any) {
      const applied = applyApiFieldErrors(error, form.setError);
      toast.error(applied ? 'Popraw pola oznaczone błędem' : (error?.message || 'Nie udało się zapisać trasy'));
    }
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    const draftName = values.name?.trim() || 'Szkic trasy';
    try {
      if (isEdit && routeId) {
        await adminService.updateRoute(routeId, {
          name: draftName,
          addressIds: values.addressIds || [],
          publicationStatus: 'DRAFT',
        });
        toast.success('Zapisano szkic trasy');
      } else {
        const created = await adminService.createRoute({
          name: draftName,
          addressIds: values.addressIds || [],
          publicationStatus: 'DRAFT',
        });
        toast.success('Utworzono szkic trasy');
        navigate(`/admin/routes/${created.id}/edit`);
      }
      setPublicationStatus('DRAFT');
    } catch (error: any) {
      console.error('Draft save failed:', error);
      toast.error(error?.message || 'Nie udało się zapisać szkicu');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie trasy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={isEdit ? 'Edytuj trasę' : 'Nowa trasa'}
        subtitle="Ustal kolejność adresów i zapisz trasę"
        onBack={() => navigate(ROUTES.ADMIN.ROUTES)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-6 pb-10 space-y-4 max-w-6xl mx-auto">
        {publicationStatus === 'DRAFT' && (
          <Alert>
            <AlertTitle>Trasa w trakcie przygotowania</AlertTitle>
            <AlertDescription>
              Szkic jest zapisany w bazie i nie jest widoczny dla pracowników w terenie.
              Opublikuj trasę, gdy będzie gotowa.
            </AlertDescription>
          </Alert>
        )}
        {showDraftPrompt && draftInfo && (
          <Alert>
            <AlertTitle>Odnaleziono zapisany szkic</AlertTitle>
            <AlertDescription>
              Szkic zapisany {new Date(draftInfo.updatedAt).toLocaleString('pl-PL')}. Możesz go przywrócić
              lub odrzucić.
            </AlertDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  form.reset({
                    name: draftInfo.name,
                    addressIds: draftInfo.addressIds,
                  });
                  setShowDraftPrompt(false);
                }}
              >
                Przywróć szkic
              </Button>
              <Button size="sm" variant="outline" onClick={clearDraft}>
                Odrzuć szkic
              </Button>
            </div>
          </Alert>
        )}
        {inactiveSelectedCount > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Trasa zawiera nieaktywne adresy</AlertTitle>
            <AlertDescription>
              {inactiveSelectedCount} {inactiveSelectedCount === 1 ? 'adres jest' : 'adresy są'} oznaczone jako nieaktywne.
              Usuń je z trasy lub aktywuj w bazie adresów.
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isEdit ? 'Edytuj szczegóły trasy i kolejność adresów' : 'Uzupełnij dane i zbuduj trasę'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => navigate(ROUTES.ADMIN.ROUTES)}>
                  Anuluj
                </Button>
                {publicationStatus === 'DRAFT' && (
                  <Button variant="outline" type="button" onClick={handleSaveDraft}>
                    Zapisz szkic
                  </Button>
                )}
                <Button type="submit">
                  {publicationStatus === 'DRAFT' ? 'Opublikuj trasę' : (isEdit ? 'Zapisz zmiany' : 'Dodaj trasę')}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Informacje o trasie</p>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa trasy</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Wyszukiwanie adresów</p>
                <div>
                  <label className="text-sm font-medium text-foreground">Szukaj adresu</label>
                  <Input
                    placeholder="Wpisz ulicę, miasto lub numer..."
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={addressFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setAddressFilter('all')}
                >
                  Wszystkie
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addressFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setAddressFilter('active')}
                >
                  Tylko aktywne
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={addressFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setAddressFilter('inactive')}
                >
                  Tylko nieaktywne
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={assignmentFilter === 'unassigned' ? 'default' : 'outline'}
                  onClick={() => setAssignmentFilter('unassigned')}
                >
                  Tylko nieprzypisane
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={assignmentFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setAssignmentFilter('all')}
                >
                  Wszystkie przypisania
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

              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  Zaawansowane filtry
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowAdvancedFilters(prev => !prev)}
                >
                  {showAdvancedFilters ? 'Ukryj' : 'Pokaż'}
                </Button>
              </div>

              {showAdvancedFilters && (
                <>
                  <div className="flex flex-col md:flex-row flex-wrap gap-3">
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
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
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

            <FormField
              control={form.control}
              name="addressIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresy</FormLabel>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Dostępne adresy</p>
                      <div className="max-h-[60vh] overflow-auto space-y-2">
                        {availableActive.map(address => {
                          const isAdded = field.value.includes(address.id);
                          const isInactive = !address.active;
                          return (
                            <button
                              key={address.id}
                              type="button"
                              className={cn(
                                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm',
                                isAdded ? 'text-muted-foreground line-through' : 'hover:bg-muted/50',
                                isInactive && 'opacity-60 cursor-not-allowed hover:bg-transparent'
                              )}
                              onClick={() => {
                                if (isAdded || isInactive) return;
                                field.onChange([...field.value, address.id]);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span>{address.street} {address.number}, {address.city}</span>
                                {isCompanyAddress(address) && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                                    Firma
                                  </span>
                                )}
                                {!address.active && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-destructive/40 text-destructive">
                                    Nieaktywna
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {isAdded ? 'Dodano' : 'Dodaj'} {!isAdded && <MoveRight className="w-3 h-3" />}
                              </span>
                            </button>
                          );
                        })}
                        {availableInactive.length > 0 && (
                          <div className="pt-3">
                            <p className="text-xs text-muted-foreground mb-2">Archiwum</p>
                            <div className="space-y-2">
                              {availableInactive.map(address => {
                                const isAdded = field.value.includes(address.id);
                                return (
                                  <button
                                    key={address.id}
                                    type="button"
                                    className={cn(
                                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm',
                                      isAdded ? 'text-muted-foreground line-through' : 'hover:bg-muted/50',
                                      'opacity-60 cursor-not-allowed hover:bg-transparent'
                                    )}
                                    onClick={() => {
                                      if (isAdded) return;
                                    }}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span>{address.street} {address.number}, {address.city}</span>
                                      {isCompanyAddress(address) && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                                          Firma
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-destructive/40 text-destructive">
                                        Nieaktywna
                                      </span>
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      {isAdded ? 'Dodano' : 'Archiwum'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {filteredAddresses.length === 0 && (
                          <p className="text-sm text-muted-foreground">Brak adresów do wyboru</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Wybrane adresy</span>
                        <div className="flex items-center gap-2">
                          <span>Kolejność</span>
                          {Object.keys(movedMap).length > 0 && (
                            <button
                              type="button"
                              className="text-xs text-muted-foreground underline"
                              onClick={() => setMovedMap({})}
                            >
                              Wyczyść oznaczenia
                            </button>
                          )}
                        </div>
                      </div>
                      {Object.keys(movedMap).length > 0 && (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                          Zmienione pozycje: {Object.entries(movedMap)
                            .map(([id, move]) => {
                              const address = addresses.find(item => item.id === id);
                              const label = address
                                ? `${address.street} ${address.number}`
                                : `ID ${id}`;
                              return `${label} (${move.from + 1} → ${move.to + 1})`;
                            })
                            .join(', ')}
                        </div>
                      )}
                      <div className="max-h-[60vh] overflow-auto space-y-2">
                        {field.value.map((addressId, index) => {
                          const address = addresses.find(item => item.id === addressId);
                          if (!address) return null;
                          const moveInfo = movedMap[addressId];
                          const isMoved = Boolean(moveInfo);
                          return (
                            <div
                              key={address.id}
                              className={cn(
                                'flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm',
                                isMoved ? 'border-primary/50 bg-primary/5' : 'border-border',
                                !address.active && 'border-destructive/40 bg-destructive/5'
                              )}
                            >
                              <span className={cn('w-6 text-xs', isMoved ? 'text-primary' : 'text-muted-foreground')}>
                                {index + 1}.
                              </span>
                              <span className="flex-1">
                                {address.street} {address.number}, {address.city}
                              </span>
                              {isCompanyAddress(address) && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                                  Firma
                                </span>
                              )}
                              {!address.active && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-destructive/40 text-destructive">
                                  Nieaktywna
                                </span>
                              )}
                              {isMoved && moveInfo && (
                                <span className="text-xs text-primary">
                                  {moveInfo.from + 1} → {moveInfo.to + 1}
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="p-1 rounded-md border border-border hover:bg-muted/50"
                                  onClick={() => moveAddress(index, index - 1)}
                                  disabled={index === 0}
                                  aria-label="Przenieś wyżej"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded-md border border-border hover:bg-muted/50"
                                  onClick={() => moveAddress(index, index + 1)}
                                  disabled={index === field.value.length - 1}
                                  aria-label="Przenieś niżej"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded-md border border-border text-muted-foreground hover:text-destructive"
                                  onClick={() => field.onChange(field.value.filter(id => id !== address.id))}
                                  aria-label="Usuń adres"
                                >
                                  Usuń
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {field.value.length === 0 && (
                          <p className="text-sm text-muted-foreground">Wybierz adresy z listy po lewej</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" type="button" onClick={() => navigate(ROUTES.ADMIN.ROUTES)}>
                Anuluj
              </Button>
              {publicationStatus === 'DRAFT' && (
                <Button variant="outline" type="button" onClick={handleSaveDraft}>
                  Zapisz szkic
                </Button>
              )}
              <Button type="submit">
                {publicationStatus === 'DRAFT' ? 'Opublikuj trasę' : (isEdit ? 'Zapisz zmiany' : 'Dodaj trasę')}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
