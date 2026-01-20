import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Address, WasteCategory, AddressStatus, AddressIssueReason, AddressIssueFlag } from '@/types/waste';
import { WasteCounter } from '@/components/WasteCounter';
import { Header } from '@/components/Header';
import { Check, MapPin, AlertTriangle, PauseCircle, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutes } from '@/contexts/RouteContext';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { ISSUE_REASON_LABELS, ISSUE_FLAG_LABELS } from '@/constants/collection';

export const CollectionView = () => {
  const { routeId, addressId } = useParams<{ routeId: string; addressId: string }>();
  const navigate = useNavigate();
  const {
    selectedRoute,
    updateAddressCollection,
    selectedWasteTypes,
    getCollectionDraft,
    saveCollectionDraft,
  } = useRoutes();
  
  const [address, setAddress] = useState<Address | null>(null);
  const [waste, setWaste] = useState<WasteCategory[]>([]);
  const [status, setStatus] = useState<AddressStatus>('COLLECTED');
  const [issueReason, setIssueReason] = useState<AddressIssueReason | ''>('');
  const [issueFlags, setIssueFlags] = useState<AddressIssueFlag[]>([]);
  const [issueNote, setIssueNote] = useState('');
  const [issuePhoto, setIssuePhoto] = useState<string | undefined>(undefined);
  const [reportToAdmin, setReportToAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftLocked, setIsDraftLocked] = useState(false);

  const visibleWaste = useMemo(() => {
    if (selectedWasteTypes.length === 0) {
      return waste;
    }
    return waste.filter(item => selectedWasteTypes.includes(item.id));
  }, [waste, selectedWasteTypes]);

  // Calculate total count - MUST be before conditional returns
  const totalCount = useMemo(() => {
    return visibleWaste.reduce((sum, w) => sum + w.count, 0);
  }, [visibleWaste]);

  // Load address on mount
  useEffect(() => {
    if (!selectedRoute || !addressId) {
      navigate(`/driver/route/${routeId}`);
      return;
    }

    if (selectedWasteTypes.length === 0) {
      toast.error('Wybierz rodzaj odpadów na dziś');
      navigate(ROUTES.DRIVER.ROUTES);
      return;
    }

    const foundAddress = selectedRoute.addresses.find(a => a.id === addressId);
    if (foundAddress) {
      setAddress(foundAddress);
      setWaste(foundAddress.waste);
      const initialStatus = foundAddress.status ?? (foundAddress.isCollected ? 'COLLECTED' : 'PENDING');
      setStatus(initialStatus === 'PENDING' ? 'COLLECTED' : initialStatus);
      setIssueReason(foundAddress.issueReason || '');
      setIssueFlags(foundAddress.issueFlags || []);
      setIssueNote(foundAddress.issueNote || '');
      setIssuePhoto(foundAddress.issuePhoto);
      setReportToAdmin(foundAddress.reportToAdmin ?? false);

      if (routeId) {
        const draft = getCollectionDraft(routeId, addressId);
        if (draft) {
          setWaste(draft.waste);
          setStatus(draft.status ?? 'COLLECTED');
          setIssueReason(draft.issueReason || '');
          setIssueFlags(draft.issueFlags || []);
          setIssueNote(draft.issueNote || '');
          setIssuePhoto(draft.issuePhoto);
          setReportToAdmin(draft.reportToAdmin ?? false);
        }
      }
    } else {
      navigate(`/driver/route/${routeId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId]); // Only re-run when addressId changes

  const handleBack = () => {
    navigate(`/driver/route/${routeId}`);
  };

  const handleIncrement = (id: string) => {
    setWaste(prev =>
      prev.map(w => (w.id === id ? { ...w, count: w.count + 1 } : w))
    );
  };

  const handleDecrement = (id: string) => {
    setWaste(prev =>
      prev.map(w => (w.id === id && w.count > 0 ? { ...w, count: w.count - 1 } : w))
    );
  };

  const handleSave = async () => {
    if (!routeId || !addressId) return;
    if (status === 'ISSUE') {
      if (!issueReason) {
        toast.error('Wybierz powód problemu');
        return;
      }
      if (!issueNote.trim()) {
        toast.error('Dodaj obowiązkową notatkę');
        return;
      }
      if (!issuePhoto) {
        toast.error('Dodaj zdjęcie z miejsca zdarzenia');
        return;
      }
    }

    if (status === 'DEFERRED' && !issueReason) {
      toast.error('Wybierz powód odłożenia');
      return;
    }
    
    setIsSaving(true);
    setIsDraftLocked(true);
    
    try {
      const wasteForSave = status === 'COLLECTED'
        ? waste
        : waste.map(item => ({ ...item, count: 0 }));

      await updateAddressCollection(routeId, addressId, wasteForSave, {
        status,
        issueReason: status !== 'COLLECTED' ? (issueReason || undefined) : undefined,
        issueFlags: status === 'ISSUE' ? issueFlags : [],
        issueNote: status === 'ISSUE' ? (issueNote.trim() || undefined) : undefined,
        issuePhoto: status === 'ISSUE' ? issuePhoto : undefined,
        reportToAdmin: status === 'ISSUE' ? (reportToAdmin || undefined) : undefined,
      });
      // Navigate back after successful save
      setTimeout(() => {
        navigate(`/driver/route/${routeId}`);
      }, 500);
    } catch (error) {
      setIsDraftLocked(false);
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!routeId || !addressId) return;
    if (!address) return;
    if (isDraftLocked || isSaving) return;

    if (status !== 'ISSUE') {
      setIssueFlags([]);
      setIssueNote('');
      setIssuePhoto(undefined);
      setReportToAdmin(false);
    }

    if (status === 'COLLECTED') {
      setIssueReason('');
    }

    saveCollectionDraft({
      routeId,
      addressId,
      waste,
      status,
      issueReason: status !== 'COLLECTED' ? (issueReason || undefined) : undefined,
      issueFlags: status === 'ISSUE' ? issueFlags : [],
      issueNote: status === 'ISSUE' ? (issueNote.trim() || undefined) : undefined,
      issuePhoto: status === 'ISSUE' ? issuePhoto : undefined,
      reportToAdmin: status === 'ISSUE' ? reportToAdmin : undefined,
      updatedAt: new Date().toISOString(),
    });
  }, [
    routeId,
    addressId,
    address,
    waste,
    status,
    issueReason,
    issueFlags,
    issueNote,
    issuePhoto,
    reportToAdmin,
    saveCollectionDraft,
    isDraftLocked,
    isSaving,
  ]);

  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={`${address.street} ${address.number}`}
        subtitle={address.city}
        onBack={handleBack}
        rightElement={
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
        }
      />

      <main className="flex-1 p-4 space-y-4 pb-32 overflow-auto">
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">Status odbioru</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setStatus('COLLECTED')}
              className={cn(
                'rounded-xl border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                status === 'COLLECTED'
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border text-muted-foreground'
              )}
            >
              Odebrane
            </button>
            <button
              type="button"
              onClick={() => setStatus('DEFERRED')}
              className={cn(
                'rounded-xl border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                status === 'DEFERRED'
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'border-border text-muted-foreground'
              )}
            >
              Odłóż na później
            </button>
            <button
              type="button"
              onClick={() => setStatus('ISSUE')}
              className={cn(
                'rounded-xl border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                status === 'ISSUE'
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : 'border-border text-muted-foreground'
              )}
            >
              Problem
            </button>
          </div>
        </div>

        {(status === 'ISSUE' || status === 'DEFERRED') && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {status === 'ISSUE' ? 'Powód problemu' : 'Powód odłożenia'}
              </p>
              {status === 'ISSUE' ? (
                <p className="text-xs text-muted-foreground">Wymagane: powód, notatka i zdjęcie.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Wymagane: wybór powodu.</p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(ISSUE_REASON_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIssueReason(key as AddressIssueReason)}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-all active:scale-[0.98]',
                    issueReason === key
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === 'ISSUE' && (
          <>
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <p className="text-sm font-semibold text-foreground">Problemy na adresie</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(ISSUE_FLAG_LABELS).map(([key, label]) => {
                  const isChecked = issueFlags.includes(key as AddressIssueFlag);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setIssueFlags(prev =>
                          prev.includes(key as AddressIssueFlag)
                            ? prev.filter(item => item !== key)
                            : [...prev, key as AddressIssueFlag]
                        );
                      }}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-all active:scale-[0.98]',
                        isChecked
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <p className="text-sm font-semibold text-foreground">Notatka (wymagana)</p>
              <textarea
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Dodaj opis sytuacji..."
              />
            </div>
          </>
        )}

        {status === 'ISSUE' && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <p className="text-sm font-semibold text-foreground">Zdjęcie (wymagane)</p>
            <div className="flex flex-col gap-3">
              {issuePhoto ? (
                <div className="space-y-2">
                  <img
                    src={issuePhoto}
                    alt="Załączone zdjęcie"
                    className="w-full rounded-xl border border-border object-cover max-h-64"
                  />
                  <button
                    type="button"
                    onClick={() => setIssuePhoto(undefined)}
                    className="text-sm text-destructive underline"
                  >
                    Usuń zdjęcie
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  <Camera className="w-5 h-5" />
                  Dodaj zdjęcie
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setIssuePhoto(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {status === 'ISSUE' && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={reportToAdmin}
              onChange={(e) => setReportToAdmin(e.target.checked)}
              className="h-4 w-4 rounded border border-border"
            />
            Zgłoś do administracji
          </label>
        )}

        {status === 'COLLECTED' && (
          <>
            {visibleWaste.map((category) => (
              <WasteCounter
                key={category.id}
                type={category.id}
                name={category.name}
                icon={category.icon}
                count={category.count}
                onIncrement={() => handleIncrement(category.id)}
                onDecrement={() => handleDecrement(category.id)}
              />
            ))}
          </>
        )}
      </main>

      {/* Fixed bottom save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'w-full py-5 rounded-2xl font-bold text-lg',
            'flex items-center justify-center gap-3',
            'transition-all duration-150',
            'focus:outline-none focus:ring-4 focus:ring-primary/30',
            status === 'COLLECTED' ? (totalCount > 0)
              ? 'bg-primary text-primary-foreground active:scale-[0.98] shadow-lg shadow-primary/25'
              : 'bg-secondary text-secondary-foreground'
              : 'bg-primary text-primary-foreground active:scale-[0.98] shadow-lg shadow-primary/25',
            isSaving && 'opacity-70 cursor-wait'
          )}
        >
          {status === 'COLLECTED' ? (
            <Check className="w-6 h-6" strokeWidth={3} />
          ) : status === 'DEFERRED' ? (
            <PauseCircle className="w-6 h-6" strokeWidth={3} />
          ) : (
            <AlertTriangle className="w-6 h-6" strokeWidth={3} />
          )}
          <span>
            {status === 'COLLECTED' ? 'Zapisz odbiór' : status === 'DEFERRED' ? 'Odłóż adres' : 'Zgłoś problem'}
            {status === 'COLLECTED' && totalCount > 0 && (
              <span className="ml-2 px-3 py-1 bg-primary-foreground/20 rounded-full text-base">
                {totalCount}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
