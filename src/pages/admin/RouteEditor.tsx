import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ArrowDown, ArrowUp, MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { applyApiFieldErrors } from '@/utils/formErrors';

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
  const [assignedAddressIds, setAssignedAddressIds] = useState<string[]>([]);
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

  const filteredAddresses = useMemo(() => {
    const search = addressSearch.trim().toLowerCase();
    let filtered = !search
      ? addresses
      : addresses.filter(address =>
          address.street.toLowerCase().includes(search) ||
          address.city.toLowerCase().includes(search) ||
          address.number.toLowerCase().includes(search)
        );
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
    return [...filtered].sort((a, b) => Number(b.active) - Number(a.active));
  }, [addresses, addressSearch, addressFilter, assignmentFilter, assignedAddressIds, selectedAddressIds]);

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
    return Boolean(address.notes?.includes('Typ: Firma') || address.notes?.includes('Właściciel:'));
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
              <div className="flex items-end">
                <Input
                  placeholder="Szukaj adresu..."
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                />
              </div>
            </div>
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
