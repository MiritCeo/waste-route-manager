import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/kompaktowy-pleszew-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!employeeId.trim()) {
      setError('Wprowadź numer pracownika');
      return;
    }
    
    if (!pin.trim() || pin.length < 4) {
      setError('PIN musi mieć minimum 4 cyfry');
      return;
    }

    setIsLoading(true);
    
    try {
      await login({ employeeId, pin });
      
      // Redirect based on where user came from or to default route
      const from = (location.state as any)?.from?.pathname || ROUTES.DRIVER.ROUTES;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Nie udało się zalogować');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col">
      {/* Header with logo */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo and title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={logo} 
                alt="Kompaktowy Pleszew" 
                className="h-16 object-contain"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                System Odbioru Odpadów
              </h1>
              <p className="text-muted-foreground">
                Zaloguj się, aby rozpocząć pracę
              </p>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Numer pracownika"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="h-14 pl-12 text-lg rounded-xl bg-card border-border"
                  autoComplete="username"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-14 pl-12 text-lg rounded-xl bg-card border-border"
                  autoComplete="current-password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Zaloguj się
                </>
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Demo: 001 / 1234 (kierowca), 002 / 1234 (admin)</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Kompaktowy Pleszew
        </p>
      </div>
    </div>
  );
};
