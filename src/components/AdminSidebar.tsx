import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  MapPin,
  Route as RouteIcon,
  Settings,
  Users,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  permission?: Parameters<ReturnType<typeof usePermissions>['can']>[0];
};

const baseItemClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal transition-colors';
const activeItemClass = 'bg-primary/10 text-primary';
const inactiveItemClass = 'text-muted-foreground hover:bg-muted/50 hover:text-foreground';

export const AdminSidebar = () => {
  const { can } = usePermissions();

  const items: NavItem[] = [
    {
      label: 'Dashboard',
      to: ROUTES.ADMIN.DASHBOARD,
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      label: 'Trasy',
      to: ROUTES.ADMIN.ROUTES,
      icon: <RouteIcon className="w-4 h-4" />,
      permission: 'MANAGE_ROUTES',
    },
    {
      label: 'Adresy',
      to: ROUTES.ADMIN.ADDRESSES,
      icon: <MapPin className="w-4 h-4" />,
      permission: 'MANAGE_ADDRESSES',
    },
    {
      label: 'Statystyka adresów',
      to: ROUTES.ADMIN.ADDRESS_STATS_OVERVIEW,
      icon: <BarChart3 className="w-4 h-4" />,
      permission: 'MANAGE_ADDRESSES',
    },
    {
      label: 'Pracownicy',
      to: ROUTES.ADMIN.EMPLOYEES,
      icon: <Users className="w-4 h-4" />,
      permission: 'MANAGE_USERS',
    },
    {
      label: 'Ostrzeżenia',
      to: ROUTES.ADMIN.ISSUES,
      icon: <AlertTriangle className="w-4 h-4" />,
      permission: 'VIEW_WARNINGS',
    },
    {
      label: 'Statystyki',
      to: ROUTES.ADMIN.STATISTICS,
      icon: <BarChart3 className="w-4 h-4" />,
      permission: 'VIEW_STATISTICS',
    },
    {
      label: 'Dzienny raport',
      to: ROUTES.ADMIN.DAILY_STATS,
      icon: <CalendarDays className="w-4 h-4" />,
      permission: 'VIEW_STATISTICS',
    },
    {
      label: 'Ustawienia',
      to: ROUTES.ADMIN.SETTINGS,
      icon: <Settings className="w-4 h-4" />,
      permission: 'MANAGE_SETTINGS',
    },
  ];

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-background/95 backdrop-blur-sm p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Menu</p>
      <nav className="flex flex-col gap-1">
        {items
          .filter(item => !item.permission || can(item.permission))
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(baseItemClass, isActive ? activeItemClass : inactiveItemClass)
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};
