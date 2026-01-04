import {
  LayoutDashboard,
  ShoppingCart,
  FolderTree,
  Settings,
  Users,
  ChefHat,
  BarChart3,
  Send,
  Package,
  Club,
  Tag,
  TrendingUp,
  Brain,
  Bot,
  Ticket,
  Image,
  CreditCard,
  Box,
  Layers,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useModuleAccess } from '@/hooks/useSubscription';
import { useStore } from '@/contexts/StoreContext';
import packageJson from '../../../package.json';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/kitchen', label: 'Cocina', icon: ChefHat, requiresFoodBusiness: true },
  { path: '/admin/orders', label: 'Pedidos', icon: ShoppingCart, requiresCatalog: true },
  { path: '/admin/categories', label: 'Categorías', icon: FolderTree },
  { path: '/admin/menu-items', label: 'Productos', icon: Box },
  { path: '/admin/extra-groups', label: 'Grupos de Extras', icon: Layers },
  { path: '/admin/customers', label: 'Clientes', icon: Users },
  { path: '/admin/promotions', label: 'Promociones', icon: Tag },
  { path: '/admin/coupons', label: 'Cupones', icon: Ticket },
  { path: '/admin/analytics', label: 'Análisis y Reportes', icon: BarChart3 },
  { path: '/admin/subscription', label: 'Suscripción', icon: CreditCard },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
];

const navIntegration = [
  { path: '/admin/whatsapp', label: 'Whatsapp', icon: Send },
  // { path: '/admin/chatbot', label: 'Lis Bot', icon: Bot },
  { path: '/admin/ai', label: 'Estudio Imagen IA', icon: Image },
  { path: '/admin/delivery', label: 'Delivery', icon: Package, requiresModule: 'delivery' as const },
  // { path: '/admin/fidelity', label: 'Fidelidad', icon: Club },
  // { path: '/admin/point-sale', label: 'Punto de Venta', icon: Club },
  // { path: '/admin/custom-domain', label: 'Dominio Propio', icon: Club },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { store } = useStore();
  const { data: hasDeliveryModule } = useModuleAccess('delivery');

  // Check if the store is a food business
  const isFoodBusiness = store?.is_food_business ?? true;
  const isCatalogMode = store?.catalog_mode ?? false;
  // Filter navigation items based on food business type
  const filteredNavItems = navItems.filter((item) => {
    if (isCatalogMode) {
      if (item.requiresFoodBusiness) {
        return false;
      }
      if (item.requiresCatalog) {
        return !isCatalogMode;
      }
    }
    if (item.requiresFoodBusiness) {
      return isFoodBusiness;
    }
    return true;
  });

  // Filter navigation items based on module access
  const filteredNavIntegration = navIntegration.filter((item) => {
    if (item.requiresModule === 'delivery') {
      return hasDeliveryModule === true;
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-5">Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin'}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <Icon className="h-6 w-6" />
                        {open && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupLabel className="mt-5">Integraciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavIntegration.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin'}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <Icon className="h-6 w-6" />
                        {open && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t">
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3" />v{packageJson.version}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
