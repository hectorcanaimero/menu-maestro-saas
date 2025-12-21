import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Loader2, ShieldAlert } from 'lucide-react';
import { isPlatformAdminDomain } from '@/lib/subdomain-validation';

interface PlatformAdminGuardProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'support' | 'billing';
}

/**
 * Componente guard que protege rutas del panel de administración de plataforma
 * Solo permite acceso a usuarios con rol de platform admin Y desde el dominio www.pideai.com
 */
export function PlatformAdminGuard({ children, requiredRole }: PlatformAdminGuardProps) {
  const { isAdmin, role, isLoading } = usePlatformAdmin();

  // PRIMERA VALIDACIÓN: Verificar que viene desde el dominio correcto
  const isValidDomain = isPlatformAdminDomain();

  if (!isValidDomain) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-6 bg-card rounded-lg border border-destructive text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Acceso Restringido
          </h2>
          <p className="text-muted-foreground mb-4">
            El panel de administración de plataforma solo está disponible desde el dominio principal.
          </p>
          <p className="text-sm text-muted-foreground">
            Dominio actual: <span className="font-semibold">{window.location.hostname}</span>
            <br />
            Dominio requerido: <span className="font-semibold text-primary">www.pideai.com</span>
          </p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras verifica permisos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no es admin, redirigir al home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico, verificar
  if (requiredRole && role !== requiredRole) {
    // Si no tiene el rol requerido, mostrar mensaje de acceso denegado
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-6 bg-card rounded-lg border border-border text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Acceso Denegado
          </h2>
          <p className="text-muted-foreground mb-4">
            No tienes permisos suficientes para acceder a esta sección.
          </p>
          <p className="text-sm text-muted-foreground">
            Rol requerido: <span className="font-semibold">{requiredRole}</span>
            <br />
            Tu rol actual: <span className="font-semibold">{role || 'ninguno'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Si tiene permisos, mostrar el contenido
  return <>{children}</>;
}
