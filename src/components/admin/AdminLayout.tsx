import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, ChefHat, Store as StoreIcon } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

interface AdminLayoutProps {
  children: ReactNode;
  userEmail: string;
}

const AdminLayout = ({ children, userEmail }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { store, loading: storeLoading, isStoreOwner } = useStore();

  // Initialize order notifications
  useOrderNotifications();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No tienes una tienda</h1>
          <p className="text-muted-foreground mb-6">
            Necesitas crear una tienda para acceder al panel de administración.
          </p>
          <Button onClick={() => navigate('/create-store')}>Crear mi tienda</Button>
        </div>
      </div>
    );
  }

  if (!isStoreOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
          <p className="text-muted-foreground mb-6">No tienes permisos para administrar esta tienda.</p>
          <Button onClick={() => navigate('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    // <SidebarProvider>
    //   <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
    //     <AppSidebar />

    //     <div className="flex-1 flex flex-col min-w-0">
    //       <header className="border-b bg-card sticky top-0 z-50">
    //         <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
    //           <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
    //             <SidebarTrigger />
    //             <ChefHat className="w-10 h-10 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
    //             <div className="min-w-0 flex-1">
    //               <h1 className="text-sm sm:text-xl font-bold truncate">Panel Admin</h1>
    //               <p className="text-xs sm:text-sm text-muted-foreground truncate">{store.name}</p>
    //               <p className="text-xs text-muted-foreground hidden sm:block truncate">{userEmail}</p>
    //             </div>
    //           </div>
    //           <div className="flex gap-1 sm:gap-2 flex-shrink-0">
    //             <Button variant="outline" size="sm" onClick={() => navigate('/')} className="hidden sm:flex">
    //               Ver Sitio
    //             </Button>
    //             <Button variant="outline" size="sm" onClick={handleLogout} className="sm:flex">
    //               <LogOut className="w-4 h-4 sm:mr-2" />
    //               <span className="hidden sm:inline">Cerrar Sesión</span>
    //             </Button>
    //           </div>
    //         </div>
    //       </header>

    //       <main className="flex-1 p-3 sm:p-6 overflow-x-auto">{children}</main>
    //     </div>
    //   </div>
    // </SidebarProvider>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-card sticky top-0 z-50">
            <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <SidebarTrigger />
                <ChefHat className="w-10 h-10 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-xl font-bold truncate">Panel Admin</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{store.name}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block truncate">{userEmail}</p>
                </div>
              </div>

              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => navigate('/')} className="hidden sm:flex">
                  Ver Sitio
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="sm:flex">
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-6 overflow-x-hidden max-h-[calc(100vh-64px)]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
