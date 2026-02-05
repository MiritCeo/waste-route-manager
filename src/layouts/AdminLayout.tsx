import { Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { AdminBreadcrumbProvider } from '@/contexts/AdminBreadcrumbContext';

export const AdminLayout = () => {
  const { user } = useAuth();
  const showSidebar = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const location = useLocation();

  const breadcrumb = useMemo(() => {
    const path = location.pathname.replace('/admin', '');
    if (path === '/dashboard') return 'Panel administracyjny';
    if (path.startsWith('/routes')) return 'Trasy';
    if (path.startsWith('/addresses/stats')) return 'Adresy / Statystyka ogólna';
    if (path.startsWith('/addresses/') && path.endsWith('/stats')) return 'Adresy / Statystyka adresu';
    if (path.startsWith('/addresses')) return 'Adresy';
    if (path.startsWith('/employees')) return 'Pracownicy';
    if (path.startsWith('/issues')) return 'Ostrzeżenia';
    if (path.startsWith('/statistics')) return 'Statystyki';
    if (path.startsWith('/daily-stats')) return 'Statystyki / Dzienny raport';
    if (path.startsWith('/settings')) return 'Ustawienia';
    if (path.startsWith('/import')) return 'Adresy / Import';
    return null;
  }, [location.pathname]);

  return (
    <AdminBreadcrumbProvider value={{ breadcrumb }}>
      <div className="min-h-screen bg-background flex">
        {showSidebar && <AdminSidebar />}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </AdminBreadcrumbProvider>
  );
};
