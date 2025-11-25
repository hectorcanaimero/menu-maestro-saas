import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart, Package, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { CartSheet } from '@/components/cart/CartSheet';
import { StoreHoursDisplay } from './StoreHoursDisplay';

export const Header = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { store, isStoreOwner } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <CartSheet />
            {/* Mobile Menu Toggle */}
          </div>
        </div>
      </div>
    </header>
  );
};
