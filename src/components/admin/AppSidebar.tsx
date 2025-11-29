import {
  LayoutDashboard,
  ShoppingCart,
  FolderTree,
  UtensilsCrossed,
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
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/kitchen', label: 'Cocina', icon: ChefHat },
  { path: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { path: '/admin/categories', label: 'Categorías', icon: FolderTree },
  { path: '/admin/menu-items', label: 'Productos', icon: UtensilsCrossed },
  { path: '/admin/customers', label: 'Clientes', icon: Users },
  { path: '/admin/promotions', label: 'Promociones', icon: Tag },
  { path: '/admin/coupons', label: 'Cupones', icon: Ticket },
  { path: '/admin/analytics', label: 'Análisis y Reportes', icon: BarChart3 },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
];

const navIntegration = [
  { path: '/admin/whatsapp', label: 'Whatsapp', icon: Send },
  // { path: '/admin/chatbot', label: 'Lis Bot', icon: Bot },
  { path: '/admin/ai', label: 'Estudio Imagen IA', icon: Brain },
  { path: '/admin/delivery', label: 'Delivery', icon: Package },
  // { path: '/admin/fidelity', label: 'Fidelidad', icon: Club },
  // { path: '/admin/point-sale', label: 'Punto de Venta', icon: Club },
  // { path: '/admin/custom-domain', label: 'Dominio Propio', icon: Club },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mt-5">Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
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
              {navIntegration.map((item) => {
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
    </Sidebar>
  );
}
