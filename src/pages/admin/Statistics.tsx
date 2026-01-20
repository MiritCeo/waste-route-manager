import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, Route as RouteIcon, Users, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { adminService } from '@/api/services/admin.service';
import { DashboardStats, IssueReport } from '@/types/admin';
import { toast } from 'sonner';

export const Statistics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const [dashboard, issueReports] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getIssueReports(),
        ]);
        setStats(dashboard);
        setIssues(issueReports);
      } catch (error) {
        console.error('Failed to load statistics:', error);
        toast.error('Nie udało się pobrać statystyk');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const issueSummary = useMemo(() => {
    const issueCount = issues.filter(item => item.status === 'ISSUE').length;
    const deferredCount = issues.filter(item => item.status === 'DEFERRED').length;
    return { issueCount, deferredCount };
  }, [issues]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Statystyki" 
        subtitle="Raporty i analizy"
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-6 pb-10 space-y-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <RouteIcon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Trasy</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalRoutes}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Adresy</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalAddresses}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Pracownicy</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalEmployees}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Problemy / odłożone</p>
            <p className="text-2xl font-bold text-foreground">
              {issueSummary.issueCount} / {issueSummary.deferredCount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Adresy odebrane – stan aktualny</p>
            <p className="text-2xl font-bold text-foreground">{stats.collectedAddresses}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Łącznie w systemie: {stats.totalAddresses} (pozostało: {stats.pendingAddresses})
            </p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Aktywne trasy</p>
            <p className="text-2xl font-bold text-foreground">{stats.activeRoutes}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Zakończone: {stats.completedRoutes}
            </p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Aktywni pracownicy</p>
            <p className="text-2xl font-bold text-foreground">{stats.activeEmployees}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Łącznie: {stats.totalEmployees}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Raporty i analizy</p>
              <p className="text-sm text-muted-foreground">Dzienna analiza ilości odpadów</p>
            </div>
          </div>
          <Button onClick={() => navigate(ROUTES.ADMIN.DAILY_STATS)}>
            Statystyki dzienne
          </Button>
        </div>
      </main>
    </div>
  );
};
