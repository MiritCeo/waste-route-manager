import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/roles';

export const AdminHeaderRight = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <div className="text-xs text-muted-foreground">
          <span className="block">{user?.name || `Pracownik #${user?.employeeId}`}</span>
          <span className="block">{user?.role ? ROLE_LABELS[user.role] : 'Użytkownik'}</span>
        </div>
      </div>
      <Button
        onClick={handleLogout}
        variant="outline"
        size="sm"
        className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4" />
        Wyloguj
      </Button>
    </div>
  );
};
