import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, User, Edit, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { adminService } from '@/api/services/admin.service';
import { User as UserType } from '@/types/user';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/constants/roles';
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@/constants/permissions';
import { APP_CONFIG } from '@/constants/config';
import { toast } from 'sonner';
import { applyApiFieldErrors } from '@/utils/formErrors';

const permissionEnum = z.enum([...ALL_PERMISSIONS] as [UserType['permissions'][number], ...UserType['permissions'][number][]]);
const employeeSchema = z.object({
  employeeId: z.string().min(1, 'Podaj numer pracownika'),
  name: z.string().min(2, 'Podaj imię i nazwisko'),
  email: z.string().email('Podaj poprawny email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'DRIVER']),
  permissions: z.array(permissionEnum).min(1, 'Wybierz przynajmniej jedno uprawnienie'),
  pin: z.string().optional().refine(value => !value || value.length >= 4, {
    message: 'PIN musi mieć minimum 4 cyfry',
  }),
  active: z.boolean(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const EmployeesManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserType['role']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'employeeId' | 'role' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.UI.ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<UserType | null>(null);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      role: 'DRIVER',
      permissions: ROLE_PERMISSIONS.DRIVER,
      pin: '',
      active: true,
    },
  });

  useEffect(() => {
    loadEmployees();
  }, [searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, statusFilter, sortBy, sortOrder, pageSize]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getEmployees({
        search: searchQuery || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        sortBy,
        sortOrder,
      });
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Nie udało się pobrać pracowników');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedEmployees = useMemo(() => {
    const list = [...employees];
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
  }, [employees, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const adminCount = employees.filter(employee => employee.role === 'ADMIN').length;
  const missingPermissionsCount = employees.filter(employee => (employee.permissions || []).length === 0).length;

  const getRoleBadgeColor = (role: UserType['role']) => {
    const colors = {
      ADMIN: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      MANAGER: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      DRIVER: 'bg-primary/10 text-primary border-primary/20',
    };
    return colors[role] || 'bg-muted text-muted-foreground border-muted';
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    form.reset({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      role: 'DRIVER',
      permissions: ROLE_PERMISSIONS.DRIVER,
      pin: '',
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (employee: UserType) => {
    setEditingEmployee(employee);
    form.reset({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      permissions: employee.permissions,
      pin: '',
      active: employee.active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (!editingEmployee && !values.pin?.trim()) {
      form.setError('pin', { message: 'PIN jest wymagany przy tworzeniu konta' });
      return;
    }

    try {
      if (editingEmployee) {
        await adminService.updateEmployee(editingEmployee.id, {
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          role: values.role,
          permissions: values.permissions,
          active: values.active,
          pin: values.pin || undefined,
        });
        toast.success('Zaktualizowano pracownika');
      } else {
        await adminService.createEmployee({
          employeeId: values.employeeId,
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          role: values.role,
          permissions: values.permissions,
          pin: values.pin || undefined,
          active: values.active,
        });
        toast.success('Dodano pracownika');
      }

      setIsDialogOpen(false);
      await loadEmployees();
    } catch (error: any) {
      console.error('Employee save failed:', error);
      const applied = applyApiFieldErrors(error, form.setError);
      toast.error(applied ? 'Popraw pola oznaczone błędem' : (error?.message || 'Nie udało się zapisać pracownika'));
    }
  };

  const handleDelete = async (employee: UserType) => {
    const confirmed = window.confirm(`Czy na pewno usunąć ${employee.name}?`);
    if (!confirmed) return;

    try {
      await adminService.deleteEmployee(employee.id);
      toast.success('Usunięto pracownika');
      await loadEmployees();
    } catch (error: any) {
      console.error('Employee delete failed:', error);
      toast.error(error?.message || 'Nie udało się usunąć pracownika');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie pracowników...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Zarządzanie pracownikami" 
        subtitle={`${employees.length} pracowników`}
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {missingPermissionsCount > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Konta bez uprawnień</AlertTitle>
            <AlertDescription>
              {missingPermissionsCount} {missingPermissionsCount === 1 ? 'konto nie ma' : 'konta nie mają'} ustawionych uprawnień
              i korzystają z domyślnych uprawnień wynikających z roli.
            </AlertDescription>
          </Alert>
        )}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground">Legenda ról i domyślnych uprawnień</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm">
            {(['DRIVER', 'MANAGER', 'ADMIN'] as const).map(role => (
              <div key={role} className="rounded-xl border border-border bg-background px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(role)}`}>
                    {ROLE_LABELS[role]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {ROLE_PERMISSIONS[role].map(permission => PERMISSION_LABELS[permission]).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Szukaj pracownika..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            Dodaj pracownika
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filtry
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Rola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie role</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="DRIVER">Kierowca</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszyscy</SelectItem>
              <SelectItem value="ACTIVE">Aktywni</SelectItem>
              <SelectItem value="INACTIVE">Nieaktywni</SelectItem>
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
              <SelectItem value="name">Imię i nazwisko</SelectItem>
              <SelectItem value="employeeId">Numer pracownika</SelectItem>
              <SelectItem value="role">Rola</SelectItem>
              <SelectItem value="createdAt">Data utworzenia</SelectItem>
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

        {/* Employees list */}
        <div className="space-y-3">
          {paginatedEmployees.map((employee) => (
            <div 
              key={employee.id}
              className="bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {employee.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(employee.role)}`}>
                        {ROLE_LABELS[employee.role]}
                      </span>
                      {employee.role === 'ADMIN' && adminCount <= 1 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-warning/10 text-warning border-warning/20">
                          Ostatni admin
                        </span>
                      )}
                      {!employee.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-destructive/10 text-destructive border-destructive/20">
                          Nieaktywny
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {employee.employeeId}
                    </p>
                    {employee.email && (
                      <p className="text-sm text-muted-foreground">
                        {employee.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleOpenEdit(employee)}
                  >
                    <Edit className="w-4 h-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(employee)}
                    disabled={employee.role === 'ADMIN' && adminCount <= 1}
                    title={employee.role === 'ADMIN' && adminCount <= 1
                      ? 'Nie można usunąć ostatniego administratora'
                      : 'Usuń pracownika'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {paginatedEmployees.length === 0 && (
          <div className="bg-card rounded-2xl p-12 border border-border text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'Nie znaleziono pracowników' : 'Brak pracowników'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery 
                ? 'Spróbuj zmienić kryteria wyszukiwania'
                : 'Dodaj pierwszego pracownika aby rozpocząć'
              }
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
            <DialogTitle>{editingEmployee ? 'Edytuj pracownika' : 'Dodaj pracownika'}</DialogTitle>
            <DialogDescription>
              Uzupełnij dane pracownika oraz przypisz indywidualne uprawnienia.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numer pracownika</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!!editingEmployee} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imię i nazwisko</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rola</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          const role = value as UserType['role'];
                          field.onChange(role);
                          form.setValue('permissions', ROLE_PERMISSIONS[role], { shouldValidate: true });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="DRIVER">Kierowca</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{editingEmployee ? 'Nowy PIN (opcjonalnie)' : 'PIN'}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uprawnienia</FormLabel>
                    <div className="grid gap-2 md:grid-cols-2">
                      {ALL_PERMISSIONS.map(permission => {
                        const isChecked = field.value.includes(permission);
                        return (
                          <label key={permission} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const nextValue = checked
                                  ? [...field.value, permission]
                                  : field.value.filter(item => item !== permission);
                                field.onChange(nextValue);
                              }}
                            />
                            {PERMISSION_LABELS[permission]}
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
                      Konto aktywne
                    </label>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Zapisz zmiany' : 'Dodaj pracownika'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
