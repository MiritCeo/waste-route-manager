import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouteCard } from '@/components/RouteCard';
import { Header } from '@/components/Header';
import { Truck, BarChart3, Settings2, LogOut, CloudOff } from 'lucide-react';
import logo from '@/assets/kompaktowy-pleszew-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useRoutes } from '@/contexts/RouteContext';
import { ROUTES } from '@/constants/routes';
import { BASE_WASTE_OPTIONS } from '@/constants/waste';
import { WasteType } from '@/types/waste';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const RouteSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { routes, isLoading, setSelectedRoute, selectedWasteTypes, setSelectedWasteTypes, syncQueueCount } = useRoutes();
  const [selectionDraft, setSelectionDraft] = useState<WasteType[]>([]);
  const [showSelection, setShowSelection] = useState(false);

  useEffect(() => {
    setSelectionDraft(selectedWasteTypes);
    setShowSelection(selectedWasteTypes.length === 0);
  }, [selectedWasteTypes]);

  const selectedWasteLabel = useMemo(() => {
    if (selectedWasteTypes.length === 0) return 'Brak wyboru';
    return selectedWasteTypes
      .map(type => BASE_WASTE_OPTIONS.find(option => option.id === type)?.name || type)
      .join(', ');
  }, [selectedWasteTypes]);

  const handleSelectRoute = (routeId: string) => {
    if (selectedWasteTypes.length === 0) {
      toast.error('Wybierz rodzaj odpadów na dziś');
      setShowSelection(true);
      return;
    }
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setSelectedRoute(route);
      navigate(`/driver/route/${routeId}`);
    }
  };

  const handleOpenSummary = () => {
    navigate(ROUTES.DRIVER.SUMMARY);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleConfirmSelection = () => {
    if (selectionDraft.length === 0) {
      toast.error('Wybierz przynajmniej jeden typ odpadu');
      return;
    }
    setSelectedWasteTypes(selectionDraft);
    setShowSelection(false);
  };

  const handleToggleWaste = (type: WasteType) => {
    setSelectionDraft(prev =>
      prev.includes(type) ? prev.filter(item => item !== type) : [...prev, type]
    );
  };

  const handleSelectAll = () => {
    setSelectionDraft(BASE_WASTE_OPTIONS.map(option => option.id));
  };

  const handleClearAll = () => {
    setSelectionDraft([]);
  };

  const handleResetSelection = () => {
    setSelectedWasteTypes([]);
    setSelectionDraft([]);
    setShowSelection(true);
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
        title="Wybierz trasę" 
        subtitle={new Date().toLocaleDateString('pl-PL', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
        rightElement={
          <div className="flex items-center gap-2">
            {syncQueueCount > 0 && (
              <div className="px-3 py-1 rounded-full border border-warning/30 bg-warning/10 text-warning text-xs font-semibold flex items-center gap-2">
                <CloudOff className="w-4 h-4" />
                {syncQueueCount}
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Wyloguj
            </Button>
          </div>
        }
      />

      {/* Employee badge */}
      <div className="px-4 pb-2">
        <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
          <img src={logo} alt="Kompaktowy Pleszew" className="h-8 object-contain" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Zalogowany jako</p>
            <p className="font-medium text-foreground">{user?.name || `Pracownik #${user?.employeeId}`}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <main className="p-4 pb-8 space-y-4">
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <p className="text-xs text-muted-foreground">Wybrane odpady na dziś</p>
          <p className="text-sm font-medium text-foreground">{selectedWasteLabel}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedWasteTypes.length > 0 && (
              <Button variant="outline" onClick={handleResetSelection} className="gap-2 w-full sm:w-auto">
                <Settings2 className="w-4 h-4" />
                Zmień odpady
              </Button>
            )}
            <Button onClick={handleOpenSummary} className="gap-2 w-full sm:w-auto">
              <BarChart3 className="w-4 h-4" />
              Statystyki
            </Button>
          </div>
        </div>

        {showSelection && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Wybierz rodzaj odpadów</h3>
              <p className="text-sm text-muted-foreground">
                Zaznacz, co dziś zbierasz. Na trasie zobaczysz tylko te pozycje.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Zaznacz wszystkie
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Wyczyść wybór
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BASE_WASTE_OPTIONS.map(option => {
                const isChecked = selectionDraft.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggleWaste(option.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all active:scale-[0.99] ${
                      isChecked
                        ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                        : 'border-border bg-background hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <p className="text-base font-semibold">{option.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Dotknij, aby {isChecked ? 'odznaczyć' : 'zaznaczyć'}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 ${
                          isChecked ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleConfirmSelection}>
                Zapisz wybór
              </Button>
            </div>
          </div>
        )}

        {routes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Brak dostępnych tras</p>
          </div>
        ) : (
          routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onClick={() => handleSelectRoute(route.id)}
            />
          ))
        )}
      </main>
    </div>
  );
};
