import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart, Package, User, Settings, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { CartSheet } from '@/components/cart/CartSheet';
import { StoreHoursDisplay } from './StoreHoursDisplay';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { store, isStoreOwner } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
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

          {/* Desktop Navigation */}
          {/* <nav className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
            {store && (
              <StoreHoursDisplay storeId={store.id} forceStatus={store.force_status} />
            )}
          </nav> */}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Admin Button - Only visible for store owners */}
            {isStoreOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Ir al Admin</span>
              </Button>
            )}

            {/* Share Button */}
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9" aria-label="Compartir tienda">
              <Share2 className="h-5 w-5" />
            </Button>

            {!isCatalogMode && <CartSheet />}
            {/* Mobile Menu Toggle */}
          </div>
        </div>
      </div>
    </header>
  );
};
