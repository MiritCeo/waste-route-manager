import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { adminService } from '@/api/services/admin.service';
import { DailyStatsRow } from '@/types/admin';
import { WASTE_OPTIONS } from '@/constants/waste';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDown, ArrowUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const getDefaultMonth = () => new Date().toISOString().slice(0, 7);

export const DailyStats = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState(getDefaultMonth());
  const [wasteType, setWasteType] = useState<'ALL' | (typeof WASTE_OPTIONS)[number]['id']>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<DailyStatsRow[]>([]);

  useEffect(() => {
    loadStats();
  }, [month, wasteType]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDailyStats({
        month,
        wasteType: wasteType === 'ALL' ? undefined : wasteType,
      });
      setRows(data);
    } catch (error) {
      console.error('Failed to load daily stats:', error);
      toast.error('Nie udało się pobrać statystyk dziennych');
    } finally {
      setIsLoading(false);
    }
  };

  const enrichedRows = useMemo(() => {
    return rows.map((row, index) => {
      const prev = rows[index - 1]?.totalWaste ?? 0;
      const change = prev > 0 ? ((row.totalWaste - prev) / prev) * 100 : null;
      return { ...row, change };
    });
  }, [rows]);

  const summary = useMemo(() => {
    const totalWaste = rows.reduce((sum, row) => sum + row.totalWaste, 0);
    const totalCollected = rows.reduce((sum, row) => sum + row.collectedAddresses, 0);
    const avgWaste = rows.length > 0 ? Math.round(totalWaste / rows.length) : 0;
    const byTypeTotals = WASTE_OPTIONS.reduce<Record<string, number>>((acc, option) => {
      acc[option.id] = rows.reduce((sum, row) => sum + (row.byType?.[option.id] || 0), 0);
      return acc;
    }, {});
    return { totalWaste, totalCollected, avgWaste, byTypeTotals };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Statystyki dzienne"
        subtitle="Zestawienie ilości odpadów per dzień"
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-6 pb-10 space-y-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Łącznie odpadów</p>
            <p className="text-2xl font-bold text-foreground">{summary.totalWaste}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Adresy odebrane</p>
            <p className="text-2xl font-bold text-foreground">{summary.totalCollected}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Średnio / dzień</p>
            <p className="text-2xl font-bold text-foreground">{summary.avgWaste}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-52">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={wasteType} onValueChange={(value) => setWasteType(value as typeof wasteType)}>
            <SelectTrigger className="w-full md:w-64">
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
          <Button variant="outline" onClick={loadStats}>
            Odśwież
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Odebrane adresy</TableHead>
                {WASTE_OPTIONS.map(option => (
                  <TableHead key={option.id}>{option.name}</TableHead>
                ))}
                <TableHead>Łącznie</TableHead>
                <TableHead>Zmiana dzień do dnia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                <TableCell colSpan={6 + WASTE_OPTIONS.length} className="text-muted-foreground">
                    Ładowanie danych...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && enrichedRows.length === 0 && (
                <TableRow>
                <TableCell colSpan={6 + WASTE_OPTIONS.length} className="text-muted-foreground">
                    Brak danych dla wybranego okresu
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && enrichedRows.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>
                    {new Date(row.date).toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell>{row.collectedAddresses}</TableCell>
                  {WASTE_OPTIONS.map(option => (
                    <TableCell key={option.id}>
                      {row.byType?.[option.id] ?? 0}
                    </TableCell>
                  ))}
                  <TableCell>{row.totalWaste}</TableCell>
                  <TableCell>
                    {row.change === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={row.change >= 0 ? 'text-success' : 'text-destructive'}>
                        {row.change >= 0 ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />}
                        {Math.abs(row.change).toFixed(1)}%
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {!isLoading && enrichedRows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell>Podsumowanie</TableCell>
                  <TableCell>{summary.totalCollected}</TableCell>
                  {WASTE_OPTIONS.map(option => (
                    <TableCell key={option.id}>
                      {summary.byTypeTotals[option.id] ?? 0}
                    </TableCell>
                  ))}
                  <TableCell>{summary.totalWaste}</TableCell>
                  <TableCell>—</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </main>
    </div>
  );
};
