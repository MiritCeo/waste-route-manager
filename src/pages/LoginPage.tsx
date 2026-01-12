import { useState } from 'react';
import { User, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/kompaktowy-pleszew-logo.png';

interface LoginPageProps {
  onLogin: (employeeId: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    
    // Simulate login (in real app would validate against backend)
    setTimeout(() => {
      setIsLoading(false);
      onLogin(employeeId);
    }, 500);
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
            <p>Demo: użyj dowolnego numeru i PIN 1234</p>
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
