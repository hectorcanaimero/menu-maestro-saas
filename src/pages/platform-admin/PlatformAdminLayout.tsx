import { Outlet, Link, useLocation } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  DollarSign,
  Package,
  Users,
  LogOut,
  Shield,
  BarChart3,
  Eye,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Layout principal del panel de administración de plataforma
 * Incluye sidebar con navegación y header con información del admin
 */
function PlatformAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isLoading } = usePlatformAdmin();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
      exactMatch: true,
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      href: '/posthog',
    },
    {
      label: 'Tiendas',
      icon: Store,
      href: '/stores',
    },
    {
      label: 'Catálogos',
      icon: Eye,
      href: '/catalogs',
    },
    {
      label: 'Suscripciones',
      icon: CreditCard,
      href: '/subscriptions',
    },
    {
      label: 'Pagos Pendientes',
      icon: DollarSign,
      href: '/payments',
    },
    {
      label: 'Planes',
      icon: Package,
      href: '/plans',
    },
    {
      label: 'Métodos de Pago',
      icon: Wallet,
      href: '/payment-methods',
    },
    {
      label: 'Administradores',
      icon: Users,
      href: '/admins',
      requiresSuperAdmin: true,
    },
  ];

  // Filtrar items según rol
  const visibleNavItems = navItems.filter((item) => {
    if (item.requiresSuperAdmin) {
      return role === 'super_admin';
    }
    return true;
  });

  const isActive = (href: string, exactMatch: boolean = false) => {
    if (exactMatch) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo / Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">PideAI Admin</h1>
              <p className="text-xs text-muted-foreground capitalize">{role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exactMatch);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  active && 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default PlatformAdminLayout;
