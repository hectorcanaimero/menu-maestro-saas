import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart, Package, User, Settings, Share2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { CartSheet } from '@/components/cart/CartSheet';
import { StoreHoursDisplay } from './StoreHoursDisplay';
import { toast } from 'sonner';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { Badge } from '@/components/ui/badge';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StoreInfoExpanded } from './StoreInfoExpanded';

export const Header = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { store, isStoreOwner } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const { status: storeStatus } = useStoreStatus(store?.id, store?.force_status || null);

  // Check if catalog mode is enabled
  const isCatalogMode = (store as any)?.catalog_mode ?? false;

  // Use custom logo if available
  const logoUrl = store?.logo_url;

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const menuItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/#productos' },
  ];

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('¡Enlace copiado al portapapeles!');
    } catch (error) {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b border-border bg-background
  transition-transform duration-300`}
      >
        <div className="container mx-auto px-4">
          {/* Mobile Layout: 3 columns */}
          <div className="flex md:hidden h-14 items-center justify-between">
            {/* Left: Store Status */}
            <button onClick={() => setShowStoreInfo(true)} className="flex items-center gap-2 min-w-0">
              <Badge
                variant={storeStatus.isOpen ? 'default' : 'secondary'}
                className={`font-semibold text-[10px] px-2 py-0.5 ${
                  storeStatus.isOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {storeStatus.isOpen ? 'Abierto' : 'Cerrado'}
              </Badge>
              <span className="text-[12px] text-muted-foreground flex items-center gap-0.5">
                Mas Info
                <ChevronDown className="h-2.5 w-2.5" />
              </span>
            </button>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {isStoreOwner && (
                <Button variant="outline" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-8 w-8"
                aria-label="Compartir tienda"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {!isCatalogMode && <CartSheet />}
            </div>
          </div>

          {/* Desktop Layout: Original */}
          <div className="hidden md:flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 font-bold text-xl text-foreground hover:text-primary transition-colors"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={store?.name} className="h-10 w-auto object-contain" />
              ) : (
                <span>{store?.name || 'Tienda'}</span>
              )}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isStoreOwner && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-2 h-9">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Ir al Admin</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-9 w-9"
                aria-label="Compartir tienda"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              {!isCatalogMode && <CartSheet />}
            </div>
          </div>
        </div>
      </header>

      {/* Store Info Sheet (Mobile) */}
      <Sheet open={showStoreInfo} onOpenChange={setShowStoreInfo}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{store?.name}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100%-4rem)] pb-8">
            <StoreInfoExpanded
              storeName={store?.name || ''}
              address={store?.address}
              phone={store?.phone}
              email={store?.email}
              description={store?.description}
              businessHours={storeStatus.allHours}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
