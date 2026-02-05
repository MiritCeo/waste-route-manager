import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { adminService } from '@/api/services/admin.service';
import { AddressStatsSummaryRow } from '@/types/admin';
import { WASTE_OPTIONS } from '@/constants/waste';
import { ROUTES, getAdminAddressStatsPath } from '@/constants/routes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';

export const AddressStatsOverview = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AddressStatsSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 100;

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getAddressStatsSummary();
        setRows(data);
      } catch (error) {
        console.error('Failed to load address stats summary:', error);
        toast.error('Nie udało się pobrać statystyk adresów');
      } finally {
        setIsLoading(false);
      }
    };
    loadSummary();
  }, []);

  const wasteColumns = useMemo(() => WASTE_OPTIONS, []);
  const cityOptions = useMemo(() => {
    const unique = new Set(rows.map(row => row.city));
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return rows.filter(row => {
      if (cityFilter !== 'ALL' && row.city !== cityFilter) return false;
      if (!search) return true;
      const label = `${row.street} ${row.number} ${row.city}`.toLowerCase();
      return label.includes(search);
    });
  }, [rows, searchQuery, cityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, cityFilter]);

  const summaryTotals = useMemo(() => {
    const totalsByType = Object.fromEntries(WASTE_OPTIONS.map(option => [option.id, 0]));
    let totalWaste = 0;
    rows.forEach(row => {
      totalWaste += row.totalWaste || 0;
      Object.entries(row.byType || {}).forEach(([id, count]) => {
        totalsByType[id] = (totalsByType[id] || 0) + (count || 0);
      });
    });
    return { totalWaste, totalsByType };
  }, [rows]);

  const getSizeLabel = (id: string) => {
    const match = id.match(/-(\d+)$/);
    if (match?.[1]) return `${match[1]}L`;
    return '120L';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Statystyka ogólna adresów"
        subtitle="Zestawienie zebranych odpadów per adres"
        onBack={() => navigate(ROUTES.ADMIN.STATISTICS)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="bg-card rounded-2xl p-6 border border-border flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Ładowanie statystyk adresów...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs text-muted-foreground">Łącznie odebranych</p>
                <p className="text-2xl font-bold text-foreground">{summaryTotals.totalWaste}</p>
              </div>
              {WASTE_OPTIONS.map(option => (
                <div key={option.id} className="bg-card rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{option.name}</p>
                      <p className="text-lg font-bold text-foreground">
                        {summaryTotals.totalsByType[option.id] || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
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
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full md:w-60">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Strona {currentPage} z {totalPages} · {filteredRows.length} adresów
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

            <div className="bg-card rounded-2xl border border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adres</TableHead>
                    <TableHead className="text-right">Łącznie</TableHead>
                    {wasteColumns.map(option => (
                      <TableHead key={option.id} className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-base">{option.icon}</span>
                          <span className="text-[10px] text-muted-foreground">{getSizeLabel(option.id)}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map(row => (
                    <TableRow key={row.addressId} className="hover:bg-muted/40">
                      <TableCell>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left hover:text-primary"
                          onClick={() => navigate(getAdminAddressStatsPath(row.addressId))}
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {row.street} {row.number}, {row.city}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{row.totalWaste}</TableCell>
                      {wasteColumns.map(option => (
                        <TableCell key={option.id} className="text-right">
                          {row.byType?.[option.id] || 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

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
          </>
        )}
      </main>
    </div>
  );
};
