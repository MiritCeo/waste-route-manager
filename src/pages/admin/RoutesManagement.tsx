import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Edit, Trash2, MapPin, Filter, Search, ArrowUpDown, UploadCloud } from 'lucide-react';
import { adminService } from '@/api/services/admin.service';
import { AdminRoute } from '@/types/admin';
import { APP_CONFIG } from '@/constants/config';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';

export const RoutesManagement = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'DRAFT'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'totalAddresses' | 'collectedAddresses'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.UI.ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortBy, sortOrder, pageSize]);


  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getRoutes({
        search: searchQuery || undefined,
        status:
          statusFilter === 'ALL'
            ? undefined
            : statusFilter === 'ACTIVE'
              ? 'active'
              : statusFilter === 'COMPLETED'
                ? 'completed'
                : 'draft',
        sortBy,
        sortOrder,
      });
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
      toast.error('Nie udało się pobrać tras');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (collected: number, total: number) => {
    const percentage = total === 0 ? 0 : (collected / total) * 100;
    if (percentage === 100) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-muted-foreground';
  };

  const sortedRoutes = useMemo(() => {
    const list = [...routes];
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
  }, [routes, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedRoutes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRoutes = sortedRoutes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateRoute = () => {
    navigate('/admin/routes/new');
  };

  const handleEditRoute = (routeId: string) => {
    navigate(`/admin/routes/${routeId}/edit`);
  };

  const handleDelete = async (route: AdminRoute) => {
    const confirmed = window.confirm(`Czy na pewno usunąć ${route.name}?`);
    if (!confirmed) return;

    try {
      await adminService.deleteRoute(route.id);
      toast.success('Usunięto trasę');
      await loadRoutes();
    } catch (error: any) {
      console.error('Route delete failed:', error);
      toast.error(error?.message || 'Nie udało się usunąć trasy');
    }
  };

  const handlePublish = async (routeId: string) => {
    try {
      await adminService.publishRoute(routeId);
      toast.success('Trasa została opublikowana');
      await loadRoutes();
    } catch (error: any) {
      console.error('Route publish failed:', error);
      toast.error(error?.message || 'Nie udało się opublikować trasy');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie tras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Zarządzanie trasami" 
        subtitle={`${routes.length} tras`}
        onBack={() => navigate(ROUTES.ADMIN.DASHBOARD)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {/* Action bar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lista tras</h2>
            <p className="text-sm text-muted-foreground">
              Zarządzaj trasami odbioru odpadów
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Szukaj trasy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          <Button className="gap-2" onClick={handleCreateRoute}>
              <Plus className="w-4 h-4" />
              Nowa trasa
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filtry
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              <SelectItem value="ACTIVE">Aktywne</SelectItem>
              <SelectItem value="COMPLETED">Zakończone</SelectItem>
              <SelectItem value="DRAFT">Szkice</SelectItem>
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
              <SelectItem value="name">Nazwa</SelectItem>
              <SelectItem value="totalAddresses">Liczba adresów</SelectItem>
              <SelectItem value="collectedAddresses">Odebrane adresy</SelectItem>
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

        {/* Routes list */}
        <div className="space-y-3">
          {paginatedRoutes.map((route) => (
            <div 
              key={route.id}
              className="bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {route.name}
                  </h3>
                  {route.publicationStatus === 'DRAFT' && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning">
                      Trasa w przygotowaniu — niewidoczna dla pracowników
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {route.updatedAt
                      ? `Aktualizacja: ${new Date(route.updatedAt).toLocaleString('pl-PL')}`
                      : 'Brak daty aktualizacji'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {route.publicationStatus === 'DRAFT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handlePublish(route.id)}
                    >
                      <UploadCloud className="w-4 h-4" />
                      Opublikuj
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditRoute(route.id)}>
                    <Edit className="w-4 h-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(route)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {route.totalAddresses} adresów
                  </span>
                </div>
                <div className={`text-sm font-medium ${getProgressColor(route.collectedAddresses, route.totalAddresses)}`}>
                  {route.collectedAddresses} / {route.totalAddresses} odebrane
                </div>
              </div>

              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${route.totalAddresses > 0 ? (route.collectedAddresses / route.totalAddresses) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {paginatedRoutes.length === 0 && (
          <div className="bg-card rounded-2xl p-12 border border-border text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-lg">Brak tras</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dodaj pierwszą trasę aby rozpocząć
            </p>
            <Button className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Dodaj trasę
            </Button>
          </div>
        )}
      </main>

      <div className="px-4 pb-6 max-w-7xl mx-auto">
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
      </div>

    </div>
  );
};
