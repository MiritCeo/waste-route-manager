import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { adminService } from '@/api/services/admin.service';
import { IssueReport } from '@/types/admin';
import { ISSUE_FLAG_LABELS, ISSUE_REASON_LABELS } from '@/constants/collection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, MapPin, PauseCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export const IssuesManagement = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUE' | 'DEFERRED'>('ALL');
  const [reportedFilter, setReportedFilter] = useState<'ALL' | 'REPORTED' | 'UNREPORTED'>('ALL');

  useEffect(() => {
    loadIssues();
  }, [search, statusFilter, reportedFilter]);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getIssueReports({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        reported: reportedFilter === 'ALL' ? undefined : reportedFilter === 'REPORTED',
      });
      setIssues(data);
    } catch (error) {
      console.error('Failed to load issues:', error);
      toast.error('Nie udało się pobrać zgłoszeń');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedStats = useMemo(() => {
    return {
      total: issues.length,
      issues: issues.filter(item => item.status === 'ISSUE').length,
      deferred: issues.filter(item => item.status === 'DEFERRED').length,
      reported: issues.filter(item => item.reportToAdmin).length,
    };
  }, [issues]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie zgłoszeń...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Zgłoszenia z terenu"
        subtitle={`${groupedStats.total} wpisów`}
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Zgłoszenia</p>
            <p className="text-2xl font-bold text-foreground">{groupedStats.total}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Problemy</p>
            <p className="text-2xl font-bold text-destructive">{groupedStats.issues}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Odłożone</p>
            <p className="text-2xl font-bold text-warning">{groupedStats.deferred}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Zgłoszone do admina</p>
            <p className="text-2xl font-bold text-foreground">{groupedStats.reported}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Szukaj ulicy, miasta lub trasy..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              <SelectItem value="ISSUE">Problemy</SelectItem>
              <SelectItem value="DEFERRED">Odłożone</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reportedFilter} onValueChange={(value) => setReportedFilter(value as typeof reportedFilter)}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Zgłoszenie do admina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              <SelectItem value="REPORTED">Zgłoszone</SelectItem>
              <SelectItem value="UNREPORTED">Niezgłoszone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {issues.length === 0 && (
          <div className="bg-card rounded-2xl p-12 border border-border text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-lg">Brak zgłoszeń</p>
            <p className="text-sm text-muted-foreground mt-1">
              Wszystkie adresy zostały obsłużone bez wyjątków
            </p>
          </div>
        )}

        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {issue.status === 'ISSUE' ? (
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    ) : (
                      <PauseCircle className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {issue.street} {issue.number}
                    </h3>
                    <p className="text-sm text-muted-foreground">{issue.city}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trasa: {issue.routeName}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    issue.status === 'ISSUE'
                      ? 'border-destructive/30 text-destructive'
                      : 'border-warning/30 text-warning'
                  }`}
                >
                  {issue.status === 'ISSUE' ? 'Problem' : 'Odłożone'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {issue.issueReason && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/40 text-muted-foreground">
                    {ISSUE_REASON_LABELS[issue.issueReason]}
                  </span>
                )}
                {issue.issueFlags?.map(flag => (
                  <span key={flag} className="px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/40 text-muted-foreground">
                    {ISSUE_FLAG_LABELS[flag]}
                  </span>
                ))}
                {issue.reportToAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-primary/30 text-primary">
                    Zgłoszone do admina
                  </span>
                )}
              </div>

              {issue.issueNote && (
                <div className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-3">
                  {issue.issueNote}
                </div>
              )}

              {issue.issuePhoto && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <img src={issue.issuePhoto} alt="Zgłoszone zdjęcie" className="w-full max-h-64 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-4 h-4" />
                ID adresu: {issue.addressId}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
