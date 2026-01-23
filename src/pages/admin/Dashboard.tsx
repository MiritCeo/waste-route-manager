import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Users,
  TrendingUp,
  Activity,
  Route as RouteIcon,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { adminService } from '@/api/services/admin.service';
import { DashboardStats } from '@/types/admin';
import { ROUTES } from '@/constants/routes';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [issuesCount, setIssuesCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDashboardStats();
      const issues = await adminService.getIssueReports().catch(() => []);
      setStats(data);
      setIssuesCount(issues.length);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie panelu...</p>
        </div>
      </div>
    );
  }

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
        title="Panel Administracyjny" 
        subtitle="Przegląd systemu"
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        {/* Quick stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div 
            className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(ROUTES.ADMIN.ROUTES)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <RouteIcon className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalRoutes}</p>
            <p className="text-sm text-muted-foreground">Trasy</p>
          </div>

          <div 
            className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(ROUTES.ADMIN.ADDRESSES)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalAddresses}</p>
            <p className="text-sm text-muted-foreground">Adresy</p>
          </div>

          <div 
            className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalEmployees}</p>
            <p className="text-sm text-muted-foreground">Pracownicy</p>
          </div>

          <div 
            className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(ROUTES.ADMIN.STATISTICS)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.collectedAddresses}</p>
            <p className="text-sm text-muted-foreground">Odebrane</p>
          </div>

          <div 
            className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(ROUTES.ADMIN.ISSUES)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{issuesCount}</p>
            <p className="text-sm text-muted-foreground">Powiadomienia</p>
          </div>
        </div>

        {/* Progress overview */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Postęp dzisiejszych tras</h3>
              <p className="text-sm text-muted-foreground">
                {stats.collectedAddresses} z {stats.totalAddresses} adresów
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {stats.totalAddresses > 0 
                  ? Math.round((stats.collectedAddresses / stats.totalAddresses) * 100)
                  : 0}%
              </p>
            </div>
          </div>
          
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ 
                width: `${stats.totalAddresses > 0 
                  ? (stats.collectedAddresses / stats.totalAddresses) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Routes status */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Aktywne trasy</h3>
                <p className="text-sm text-muted-foreground">W trakcie realizacji</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.activeRoutes}</p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Zakończone trasy</h3>
                <p className="text-sm text-muted-foreground">Dzisiaj</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.completedRoutes}</p>
          </div>
        </div>

        {/* Waste collection stats */}
        {stats.wasteCollected.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold text-lg text-foreground mb-4">
              Zebrane odpady
            </h3>
            <div className="space-y-2">
              {stats.wasteCollected.map((waste) => (
                <div 
                  key={waste.type}
                  className={`rounded-xl p-3 flex items-center justify-between ${getWasteColorClass(waste.type)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{waste.icon}</span>
                    <span className="font-medium">{waste.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{waste.total}</span>
                    {waste.trend !== 0 && (
                      <span className={`text-sm ${waste.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                        {waste.trend > 0 ? '+' : ''}{waste.trend.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {stats.recentActivity.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">
                Ostatnia aktywność
              </h3>
            </div>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.userName}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString('pl-PL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
