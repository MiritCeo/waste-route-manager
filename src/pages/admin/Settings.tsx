import { Header } from '@/components/Header';
import { AdminHeaderRight } from '@/components/AdminHeaderRight';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Ustawienia" 
        subtitle="Konfiguracja systemu"
        onBack={() => navigate(-1)}
        rightElement={<AdminHeaderRight />}
      />

      <main className="p-4 pb-8 space-y-4 max-w-7xl mx-auto">
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <SettingsIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-lg">Ustawienia systemu</p>
          <p className="text-sm text-muted-foreground mt-1">
            Funkcjonalność w przygotowaniu
          </p>
        </div>
      </main>
    </div>
  );
};
