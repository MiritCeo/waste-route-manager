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
import { Plus, Search, MapPin, Edit, Trash2, Filter, ArrowUpDown, Upload } from 'lucide-react';
import { adminService } from '@/api/services/admin.service';
import { AdminAddress } from '@/types/admin';
import { WASTE_OPTIONS } from '@/constants/waste';
import { WasteType } from '@/types/waste';
import { APP_CONFIG } from '@/constants/config';
import { toast } from 'sonner';
import { applyApiFieldErrors } from '@/utils/formErrors';
import { normalizeCityName } from '@/utils/addressKeys';
import { ROUTES } from '@/constants/routes';

const wasteEnum = z.enum(WASTE_OPTIONS.map(option => option.id) as [WasteType, ...WasteType[]]);
const addressSchema = z.object({
  street: z.string().min(2, 'Podaj ulicę'),
  number: z.string().min(1, 'Podaj numer'),
  city: z.string().min(2, 'Podaj miasto'),
  postalCode: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  composting: z.string().optional().or(z.literal('')),
  wasteTypes: z.array(wasteEnum).min(1, 'Wybierz przynajmniej jeden typ odpadu'),
  active: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export const AddressesManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [wasteFilter, setWasteFilter] = useState<'ALL' | WasteType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'street' | 'city' | 'createdAt'>('street');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.UI.ITEMS_PER_PAGE);
  const [addresses, setAddresses] = useState<AdminAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AdminAddress | null>(null);
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
      active: true,
    },
  });

  useEffect(() => {
    loadAddresses();
  }, [searchQuery, cityFilter, wasteFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, cityFilter, wasteFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAddresses({
        search: searchQuery || undefined,
        city: cityFilter === 'ALL' ? undefined : cityFilter,
        wasteType: wasteFilter === 'ALL' ? undefined : wasteFilter,
        active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
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

  const visibleWasteOptions = useMemo(() => WASTE_OPTIONS, []);

  const sortedAddresses = useMemo(() => {
    const list = [...addresses];
    list.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const direction = sortOrder === 'desc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
    return list;
  }, [addresses, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedAddresses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAddresses = sortedAddresses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenCreate = () => {
    setEditingAddress(null);
    form.reset({
      street: '',
      number: '',
      city: '',
      postalCode: '',
      notes: '',
      wasteTypes: [
        'mixed',
        'mixed-240',
        'bio-green',
        'bio-green-240',
        'bio-kitchen',
        'bio-kitchen-240',
      ],
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (address: AdminAddress) => {
    setEditingAddress(address);
    form.reset({
      street: address.street,
      number: address.number,
      city: address.city,
      postalCode: address.postalCode || '',
      notes: address.notes || '',
      composting: address.composting || '',
      wasteTypes: address.wasteTypes,
      active: address.active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: AddressFormValues) => {
    try {
      if (editingAddress) {
        await adminService.updateAddress(editingAddress.id, {
          street: values.street,
          number: values.number,
          city: normalizeCityName(values.city),
          postalCode: values.postalCode || undefined,
          notes: values.notes || undefined,
          composting: values.composting || undefined,
          wasteTypes: values.wasteTypes,
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
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Szukaj adresu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(ROUTES.ADMIN.IMPORT)}
            >
              <Upload className="w-4 h-4" />
              Importuj
            </Button>
            <Button className="gap-2" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              Dodaj adres
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filtry
          </div>
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
          <Select value={wasteFilter} onValueChange={(value) => setWasteFilter(value as typeof wasteFilter)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Typ odpadu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie typy</SelectItem>
              {WASTE_OPTIONS.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpDown className="w-4 h-4" />
            Sortowanie
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Sortuj po" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="street">Ulica</SelectItem>
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
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edytuj adres' : 'Dodaj adres'}</DialogTitle>
            <DialogDescription>
              Podaj szczegóły adresu i przypisz typy odpadów.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
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
                      <Textarea {...field} rows={3} />
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

              <DialogFooter>
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
