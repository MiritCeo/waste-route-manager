import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Redirect based on user role
    if (user?.role === 'ADMIN') {
      navigate(ROUTES.ADMIN.DASHBOARD);
    } else {
      navigate(ROUTES.DRIVER.ROUTES);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Brak dostępu
          </h1>
          <p className="text-muted-foreground text-lg">
            Nie masz uprawnień do przeglądania tej strony
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border text-sm text-muted-foreground">
          Jeśli uważasz, że to błąd, skontaktuj się z administratorem systemu.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć
          </Button>
          
          <Button
            onClick={handleGoHome}
            className="w-full sm:w-auto"
          >
            <Home className="w-4 h-4 mr-2" />
            Strona główna
          </Button>
        </div>
      </div>
    </div>
  );
};
