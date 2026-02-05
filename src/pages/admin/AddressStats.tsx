import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { adminService } from '@/api/services/admin.service';
import { AddressStats as AddressStatsType } from '@/types/admin';
import { ROUTES } from '@/constants/routes';
import { WASTE_OPTIONS } from '@/constants/waste';
import { toast } from 'sonner';

export const AddressStats = () => {
  const { addressId } = useParams<{ addressId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AddressStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!addressId) {
        setStats(null);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await adminService.getAddressStats(addressId);
        setStats(data);
      } catch (error) {
        console.error('Failed to load address stats:', error);
        toast.error('Nie udało się pobrać statystyk adresu');
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [addressId]);

  const getWasteLabel = (id: string) => WASTE_OPTIONS.find(option => option.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Statystyki adresu"
        subtitle="Odebrane odpady z konkretnej nieruchomości"
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="bg-card rounded-2xl p-6 border border-border flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Ładowanie statystyk...</p>
          </div>
        ) : !stats ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-sm text-muted-foreground space-y-3">
            <p>Brak wybranego adresu.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN.ADDRESS_STATS_OVERVIEW)}>
                Statystyka ogólna adresów
              </Button>
              <Button onClick={() => navigate(ROUTES.ADMIN.ADDRESSES)}>
                Wróć do adresów
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
              <p className="text-sm text-muted-foreground">Adres</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.address.street} {stats.address.number}, {stats.address.city}
              </p>
              {stats.address.postalCode && (
                <p className="text-sm text-muted-foreground">{stats.address.postalCode}</p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Łączne odbiory</p>
                <p className="text-2xl font-bold text-foreground">{stats.totals.totalCollections}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Łączna ilość odpadów</p>
                <p className="text-2xl font-bold text-foreground">{stats.totals.totalWaste}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground">Średnio na odbiór</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totals.totalCollections > 0
                    ? Math.round(stats.totals.totalWaste / stats.totals.totalCollections)
                    : 0}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Podział na frakcje</p>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(stats.totals.byType).map(([id, count]) => (
                  <div key={id} className="flex items-center justify-between text-sm border-b border-border/60 pb-1">
                    <span className="text-muted-foreground">{getWasteLabel(id)}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Statystyki dzienne</p>
                <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.ADMIN.DAILY_STATS)}>
                  Ogólne dzienne
                </Button>
              </div>
              {stats.daily.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak danych dziennych.</p>
              ) : (
                <div className="space-y-2">
                  {stats.daily.map(row => (
                    <div key={row.date} className="flex flex-wrap items-center justify-between text-sm border-b border-border/60 pb-1">
                      <span className="text-muted-foreground">{row.date}</span>
                      <span className="font-semibold text-foreground">{row.totalWaste}</span>
                      <span className="text-xs text-muted-foreground">
                        Odbiory: {row.collectedAddresses}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Statystyki miesięczne</p>
              {stats.monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak danych miesięcznych.</p>
              ) : (
                <div className="space-y-2">
                  {stats.monthly.map(row => (
                    <div key={row.month} className="flex flex-wrap items-center justify-between text-sm border-b border-border/60 pb-1">
                      <span className="text-muted-foreground">{row.month}</span>
                      <span className="font-semibold text-foreground">{row.totalWaste}</span>
                      <span className="text-xs text-muted-foreground">
                        Odbiory: {row.collectedAddresses}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
