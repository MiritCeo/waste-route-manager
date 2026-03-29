import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Save, Trash2, Plus, RotateCcw } from 'lucide-react';
import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { issueConfigService } from '@/api/services/issue-config.service';
import { wasteContainersService, WasteContainerDto } from '@/api/services/wasteContainers.service';
import { DEFAULT_ISSUE_CONFIG } from '@/constants/issueConfig';
import { IssueOption } from '@/types/issueConfig';
import { toast } from 'sonner';

export const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [issueConfig, setIssueConfig] = useState(DEFAULT_ISSUE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newIssueReason, setNewIssueReason] = useState('');
  const [newDeferredReason, setNewDeferredReason] = useState('');
  const [newIssueFlag, setNewIssueFlag] = useState('');
  const [wasteContainers, setWasteContainers] = useState<WasteContainerDto[]>([]);
  const [loadingWasteContainers, setLoadingWasteContainers] = useState(true);
  const [newWasteName, setNewWasteName] = useState('');
  const [newWasteIcon, setNewWasteIcon] = useState('🗑️');
  const [savingWaste, setSavingWaste] = useState(false);

  useEffect(() => {
    let isMounted = true;
    issueConfigService
      .getIssueConfig()
      .then((config) => {
        if (isMounted) setIssueConfig(config);
      })
      .catch(() => {
        toast.error('Nie udało się pobrać ustawień zgłoszeń');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    wasteContainersService
      .getAdminList(true)
      .then((rows) => {
        if (isMounted) setWasteContainers(rows);
      })
      .catch(() => {
        toast.error('Nie udało się pobrać rodzajów pojemników');
      })
      .finally(() => {
        if (isMounted) setLoadingWasteContainers(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const normalizeId = (label: string): string => {
    return label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  };

  const updateListLabel = (list: IssueOption[], id: string, label: string) =>
    list.map((item) => (item.id === id ? { ...item, label } : item));

  const handleAddOption = (
    label: string,
    list: IssueOption[],
    setList: (next: IssueOption[]) => void,
    clear: () => void
  ) => {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error('Wpisz nazwę');
      return;
    }
    const id = normalizeId(trimmed);
    if (!id) {
      toast.error('Nie udało się wygenerować kodu');
      return;
    }
    if (list.some((item) => item.id === id)) {
      toast.error('Taki kod już istnieje');
      return;
    }
    setList([...list, { id, label: trimmed }]);
    clear();
  };

  const handleAddWasteContainer = async () => {
    const name = newWasteName.trim();
    if (!name) {
      toast.error('Podaj nazwę pojemnika (np. „Zmieszane 360L”)');
      return;
    }
    try {
      setSavingWaste(true);
      await wasteContainersService.create({
        name,
        icon: newWasteIcon.trim() || '🗑️',
      });
      toast.success('Dodano rodzaj pojemnika');
      setNewWasteName('');
      setNewWasteIcon('🗑️');
      const rows = await wasteContainersService.getAdminList(true);
      setWasteContainers(rows);
      queryClient.invalidateQueries({ queryKey: ['waste-containers'] });
    } catch {
      toast.error('Nie udało się dodać pojemnika');
    } finally {
      setSavingWaste(false);
    }
  };

  const handleToggleWasteActive = async (row: WasteContainerDto) => {
    try {
      await wasteContainersService.update(row.id, { active: !row.active });
      setWasteContainers(prev =>
        prev.map(item => (item.id === row.id ? { ...item, active: !row.active } : item))
      );
      queryClient.invalidateQueries({ queryKey: ['waste-containers'] });
    } catch {
      toast.error('Nie udało się zapisać zmiany');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await issueConfigService.saveIssueConfig(issueConfig);
      toast.success('Zapisano ustawienia zgłoszeń');
    } catch {
      toast.error('Nie udało się zapisać ustawień');
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Ustawienia" 
        subtitle="Konfiguracja systemu"
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        <div className="bg-card rounded-2xl p-4 border border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Konfiguracja zgłoszeń</p>
              <p className="text-xs text-muted-foreground">
                Zarządzaj powodami i flagami widocznymi dla pracowników
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIssueConfig(DEFAULT_ISSUE_CONFIG)}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Przywróć domyślne
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Powody problemów</p>
              <p className="text-xs text-muted-foreground">Lista powodów widocznych przy statusie Problem.</p>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Ładowanie...</p>
            ) : (
              <div className="space-y-2">
                {issueConfig.issueReasons.map((reason) => (
                  <div key={reason.id} className="flex items-center gap-2">
                    <Input
                      value={reason.label}
                      onChange={(event) =>
                        setIssueConfig((prev) => ({
                          ...prev,
                          issueReasons: updateListLabel(prev.issueReasons, reason.id, event.target.value),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setIssueConfig((prev) => ({
                          ...prev,
                          issueReasons: prev.issueReasons.filter((item) => item.id !== reason.id),
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                placeholder="Dodaj nowy powód"
                value={newIssueReason}
                onChange={(event) => setNewIssueReason(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleAddOption(
                    newIssueReason,
                    issueConfig.issueReasons,
                    (next) =>
                      setIssueConfig((prev) => ({
                        ...prev,
                        issueReasons: next,
                      })),
                    () => setNewIssueReason('')
                  )
                }
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Powody odłożenia</p>
              <p className="text-xs text-muted-foreground">Lista powodów widocznych przy statusie Odłóż.</p>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Ładowanie...</p>
            ) : (
              <div className="space-y-2">
                {issueConfig.deferredReasons.map((reason) => (
                  <div key={reason.id} className="flex items-center gap-2">
                    <Input
                      value={reason.label}
                      onChange={(event) =>
                        setIssueConfig((prev) => ({
                          ...prev,
                          deferredReasons: updateListLabel(prev.deferredReasons, reason.id, event.target.value),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setIssueConfig((prev) => ({
                          ...prev,
                          deferredReasons: prev.deferredReasons.filter((item) => item.id !== reason.id),
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                placeholder="Dodaj nowy powód odłożenia"
                value={newDeferredReason}
                onChange={(event) => setNewDeferredReason(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleAddOption(
                    newDeferredReason,
                    issueConfig.deferredReasons,
                    (next) =>
                      setIssueConfig((prev) => ({
                        ...prev,
                        deferredReasons: next,
                      })),
                    () => setNewDeferredReason('')
                  )
                }
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Problemy na adresie</p>
            <p className="text-xs text-muted-foreground">Flagi wybierane w szczegółach zgłoszenia.</p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Ładowanie...</p>
          ) : (
            <div className="space-y-2">
              {issueConfig.issueFlags.map((flag) => (
                <div key={flag.id} className="flex items-center gap-2">
                  <Input
                    value={flag.label}
                    onChange={(event) =>
                      setIssueConfig((prev) => ({
                        ...prev,
                        issueFlags: updateListLabel(prev.issueFlags, flag.id, event.target.value),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setIssueConfig((prev) => ({
                        ...prev,
                        issueFlags: prev.issueFlags.filter((item) => item.id !== flag.id),
                      }))
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              placeholder="Dodaj nowy problem"
              value={newIssueFlag}
              onChange={(event) => setNewIssueFlag(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleAddOption(
                  newIssueFlag,
                  issueConfig.issueFlags,
                  (next) =>
                    setIssueConfig((prev) => ({
                      ...prev,
                      issueFlags: next,
                    })),
                  () => setNewIssueFlag('')
                )
              }
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Dodaj
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Rodzaje pojemników</p>
              <p className="text-xs text-muted-foreground max-w-xl">
                Lista frakcji używana przy adresach, trasach i w aplikacji kierowcy. Domyślne typy można
                wyłączyć (nie usuwają się z istniejących danych). Nowe wpisy możesz dowolnie nazwać — np. z
                podaną pojemnością.
              </p>
            </div>
          </div>

          {loadingWasteContainers ? (
            <p className="text-sm text-muted-foreground">Ładowanie listy pojemników...</p>
          ) : (
            <div className="space-y-2 max-h-[min(420px,50vh)] overflow-auto border border-border rounded-lg">
              {wasteContainers.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border last:border-b-0 text-sm"
                >
                  <span className="text-lg shrink-0">{row.icon}</span>
                  <span className="flex-1 min-w-[140px] font-medium">{row.name}</span>
                  <code className="text-xs text-muted-foreground truncate max-w-[200px]" title={row.id}>
                    {row.id}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant={row.active ? 'secondary' : 'outline'}
                    onClick={() => handleToggleWasteActive(row)}
                  >
                    {row.active ? 'Aktywny' : 'Wyłączony'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Dodaj nowy rodzaj</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Nazwa (np. Plastik 500L)"
                value={newWasteName}
                onChange={(e) => setNewWasteName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Ikona"
                value={newWasteIcon}
                onChange={(e) => setNewWasteIcon(e.target.value)}
                className="w-20"
                maxLength={8}
              />
              <Button type="button" onClick={handleAddWasteContainer} disabled={savingWaste}>
                {savingWaste ? 'Dodawanie...' : 'Dodaj'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
