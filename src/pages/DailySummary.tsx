import { useMemo } from 'react';
import { Route, WasteCategory } from '@/types/waste';
import { Header } from '@/components/Header';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  LogOut,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/kompaktowy-pleszew-logo.png';

interface DailySummaryProps {
  routes: Route[];
  employeeId: string;
  onLogout: () => void;
  onBack: () => void;
}

interface WasteStats {
  id: string;
  name: string;
  icon: string;
  total: number;
}

export const DailySummary = ({ routes, employeeId, onLogout, onBack }: DailySummaryProps) => {
  const stats = useMemo(() => {
    let totalAddresses = 0;
    let collectedAddresses = 0;
    const wasteMap: Record<string, WasteStats> = {};

    routes.forEach(route => {
      totalAddresses += route.totalAddresses;
      route.addresses.forEach(address => {
        if (address.isCollected) {
          collectedAddresses++;
          address.waste.forEach(waste => {
            if (!wasteMap[waste.id]) {
              wasteMap[waste.id] = {
                id: waste.id,
                name: waste.name,
                icon: waste.icon,
                total: 0,
              };
            }
            wasteMap[waste.id].total += waste.count;
          });
        }
      });
    });

    const wasteStats = Object.values(wasteMap).filter(w => w.total > 0);
    const totalWaste = wasteStats.reduce((sum, w) => sum + w.total, 0);

    return {
      totalAddresses,
      collectedAddresses,
      pendingAddresses: totalAddresses - collectedAddresses,
      progressPercent: totalAddresses > 0 ? Math.round((collectedAddresses / totalAddresses) * 100) : 0,
      wasteStats,
      totalWaste,
    };
  }, [routes]);

  const getWasteColorClass = (wasteId: string): string => {
    const colors: Record<string, string> = {
      'bio-green': 'bg-waste-bio-green-bg text-waste-bio-green',
      'bio-kitchen': 'bg-waste-bio-kitchen-bg text-waste-bio-kitchen',
      'glass-clear': 'bg-waste-glass-clear-bg text-waste-glass-clear',
      'glass-colored': 'bg-waste-glass-colored-bg text-waste-glass-colored',
      'paper': 'bg-waste-paper-bg text-waste-paper',
      'plastic': 'bg-waste-plastic-bg text-waste-plastic',
      'ash': 'bg-waste-ash-bg text-waste-ash',
      'mixed': 'bg-waste-mixed-bg text-waste-mixed',
    };
    return colors[wasteId] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Podsumowanie dnia"
        subtitle={new Date().toLocaleDateString('pl-PL', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        })}
        onBack={onBack}
        rightElement={
          <button 
            onClick={onLogout}
            className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <LogOut className="w-5 h-5 text-destructive" />
          </button>
        }
      />

      <main className="p-4 pb-8 space-y-4">
        {/* Employee info */}
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <img src={logo} alt="Logo" className="h-8 object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Pracownik</p>
            <p className="font-semibold text-foreground">Nr {employeeId}</p>
          </div>
        </div>

        {/* Progress overview */}
        <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Postęp dnia</p>
              <p className="text-2xl font-bold text-foreground">{stats.progressPercent}%</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Address stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.collectedAddresses}</p>
            <p className="text-sm text-muted-foreground">Odebrane</p>
          </div>
          
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.pendingAddresses}</p>
            <p className="text-sm text-muted-foreground">Pozostało</p>
          </div>
        </div>

        {/* Total addresses */}
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Łącznie adresów</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalAddresses}</p>
          </div>
        </div>

        {/* Waste statistics */}
        {stats.wasteStats.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Statystyki odpadów</p>
                <p className="text-sm text-muted-foreground">Łącznie: {stats.totalWaste} pojemników</p>
              </div>
            </div>

            <div className="space-y-2">
              {stats.wasteStats.map((waste) => (
                <div 
                  key={waste.id}
                  className={`rounded-xl p-3 flex items-center justify-between ${getWasteColorClass(waste.id)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{waste.icon}</span>
                    <span className="font-medium">{waste.name}</span>
                  </div>
                  <span className="text-xl font-bold">{waste.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.wasteStats.length === 0 && (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Brak zebranych odpadów</p>
            <p className="text-sm text-muted-foreground mt-1">Rozpocznij zbiórkę, aby zobaczyć statystyki</p>
          </div>
        )}

        {/* Logout button */}
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Wyloguj się
        </Button>
      </main>
    </div>
  );
};
