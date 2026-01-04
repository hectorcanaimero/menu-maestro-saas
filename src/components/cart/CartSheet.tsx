import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useCartTotals } from '@/hooks/useCartTotals';
import { useFormatPrice } from '@/lib/priceFormatter';
import { useStore } from '@/contexts/StoreContext';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { StoreClosedDialog } from '@/components/catalog/StoreClosedDialog';
import { DualPrice } from '@/components/catalog/DualPrice';
import posthog from 'posthog-js';

export const CartSheet = () => {
  const { items, updateQuantity, removeItem, totalItems } = useCart();
  const { originalTotal, discountedTotal, totalSavings } = useCartTotals(items);
  const { store } = useStore();
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const { status: storeStatus } = useStoreStatus(store?.id, store?.force_status || null);
  const [showClosedDialog, setShowClosedDialog] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open && store?.id) {
      // Track cart_viewed event when cart is opened
      try {
        posthog.capture('cart_viewed', {
          store_id: store.id,
          items_count: items.length,
          total_items: totalItems,
          cart_value: discountedTotal,
          has_items: items.length > 0,
        });
      } catch (error) {
        throw new Error(error as string | undefined);
      }
    }
  };

  const handleCheckout = () => {
    // Validate store is open
    if (!storeStatus.isOpen) {
      setShowClosedDialog(true);
      return;
    }

    navigate('/checkout');
  };

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>

        <div className="mt-8 flex flex-col">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground mt-2">Agrega productos del menú para comenzar</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 p-4 rounded-lg border bg-card">
                {totalSavings > 0 && (
                  <>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="line-through text-muted-foreground flex-shrink-0">
                        <DualPrice price={originalTotal} size="sm" />
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-green-600">Descuento:</span>
                      <span className="text-green-600 flex-shrink-0">
                        -<DualPrice price={totalSavings} size="sm" />
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center gap-4 text-lg font-bold">
                  <span>Total:</span>
                  <span className="flex-shrink-0">
                    <DualPrice
                      price={discountedTotal}
                      size="sm"
                      style={{ color: `hsl(var(--price-color, var(--primary)))` }}
                    />
                  </span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Realizar Pedido
              </Button>
              <div className="border-t pt-4 mt-4 space-y-4"></div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.map((item) => (
                  <div key={item.cartItemId || item.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex gap-4">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded" />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <div
                          className="text-sm font-semibold mt-1"
                          style={{ color: `hsl(var(--price-color, var(--primary)))` }}
                        >
                          <DualPrice
                            price={
                              (item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity
                            }
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-auto ms-8"
                            onClick={() => removeItem(item.cartItemId || item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {/* <DualPrice
                            price={
                              (item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity
                            }
                            size="sm"
                          /> */}
                        </div>
                        {/* {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{item.extras.length} extra{item.extras.length > 1 ? 's' : ''}
                          </p>
                        )} */}
                      </div>
                    </div>
                    {item.extras && item.extras.length > 0 && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                        {item.extras.map((extra, idx) => (
                          <div key={idx} className="flex justify-between gap-2">
                            <span className="truncate">+ {extra.name}</span>
                            <span className="flex-shrink-0">
                              <DualPrice price={extra.price} size="sm" />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>

      {/* Store Closed Dialog */}
      <StoreClosedDialog
        open={showClosedDialog}
        onOpenChange={setShowClosedDialog}
        storeName={store?.name}
        nextOpenTime={storeStatus.nextOpenTime}
        onViewHours={() => {
          setShowClosedDialog(false);
        }}
      />
    </Sheet>
  );
};
