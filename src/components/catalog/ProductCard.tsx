import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductExtrasDialog } from './ProductExtrasDialog';
import { useProductPromotions, getBestPromotion } from '@/hooks/usePromotions';
import { useQuickView } from '@/hooks/useQuickView';
import { useFormatPrice } from '@/lib/priceFormatter';
import { DualPrice } from '@/components/catalog/DualPrice';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description?: string | null;
  layout?: 'grid' | 'list';
  compact?: boolean;
  categoryId?: string | null;
  index?: number;
  allProducts?: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    description?: string | null;
    categoryId?: string | null;
  }>;
}

export const ProductCard = ({
  id,
  name,
  price,
  image_url,
  description,
  layout = 'list',
  compact = false,
  categoryId,
  index = 0,
  allProducts = [],
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { store } = useStore();
  const navigate = useNavigate();
  const { openQuickView } = useQuickView();
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);
  const formatPrice = useFormatPrice();

  // Get applicable promotions for this product
  const productPromotions = useProductPromotions(id, categoryId);
  const bestDeal = getBestPromotion(productPromotions, price);

  const handleAddToCart = (e: React.MouseEvent) => {
    console.log('object');
    e.stopPropagation();

    setShowExtrasDialog(true);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    const products = allProducts.length > 0 ? allProducts : [{ id, name, price, image_url, description, categoryId }];
    openQuickView({ id, name, price, image_url, description, categoryId }, products, index);
  };

  const handleConfirmWithExtras = (extras: Array<{ id: string; name: string; price: number }>) => {
    addItem({ id, name, price, image_url, extras, categoryId });
  };

  const isGridView = layout === 'grid';
  const hasDiscount = !!bestDeal;

  return (
    <>
      <ProductExtrasDialog
        open={showExtrasDialog}
        onOpenChange={setShowExtrasDialog}
        productId={id}
        productName={name}
        productPrice={price}
        onConfirm={handleConfirmWithExtras}
      />

      <Card
        className={`group h-full overflow-hidden border border-border/40 hover:border-border hover:shadow-lg transition-all duration-300 bg-card cursor-pointer rounded-lg relative ${
          compact ? 'max-w-[200px]' : ''
        }`}
        onClick={() => navigate(`/products/${id}`)}
      >
        <div className={isGridView ? 'flex flex-col h-full' : 'flex flex-col sm:flex-row h-full'}>
          {/* Image Container */}
          <div
            className={
              isGridView
                ? 'w-full aspect-square overflow-hidden bg-muted/30 relative'
                : compact
                ? 'w-full aspect-[3/2] overflow-hidden bg-muted/30 relative'
                : 'w-full sm:w-48 aspect-square sm:aspect-auto overflow-hidden bg-muted/30 flex-shrink-0 relative'
            }
          >
            {image_url ? (
              <img
                src={image_url}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                <Eye className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Sale Badge */}
            {hasDiscount && (
              <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground shadow-md flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {bestDeal.promotion.type === 'percentage'
                  ? `-${bestDeal.promotion.value}%`
                  : `-${formatPrice(bestDeal.promotion.value).original}`}
              </Badge>
            )}

            {/* Quick View Button - Shows on hover (desktop) or always (mobile) */}
            {/* <Button
              size="icon"
              variant="secondary"
              onClick={handleQuickView}
              className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-md opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background z-10"
              aria-label={`Vista rápida de ${name}`}
            >
              <Eye className="h-4 w-4" />
            </Button> */}
          </div>

          {/* Content Container */}
          <div className="flex flex-col flex-1 p-3 sm:p-4">
            {/* Product Info */}
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">{name}</h3>
              {description && !compact && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
              )}

              {/* Price Display with Discount */}
              <div className="pt-1">
                {hasDiscount ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <DualPrice
                      price={bestDeal.discountedPrice}
                      size="sm"
                      className="[&>div:first-child]:text-base [&>div:first-child]:sm:text-lg"
                      style={{ color: `hsl(var(--price-color, var(--foreground)))` } as React.CSSProperties}
                    />
                    <div className="text-xs sm:text-sm text-muted-foreground line-through">
                      <DualPrice price={price} size="sm" />
                    </div>
                    {/* <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      Ahorra <DualPrice price={bestDeal.savings} size="sm" />
                    </Badge> */}
                  </div>
                ) : (
                  <DualPrice
                    price={price}
                    size="sm"
                    className="[&>div:first-child]:text-base [&>div:first-child]:sm:text-lg"
                    style={{ color: `hsl(var(--price-color, var(--foreground)))` } as React.CSSProperties}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Floating Add Button - Touch-friendly on mobile */}
          <Button
            size="icon"
            onClick={() => navigate(`/products/${id}`)}
            // onClick={handleAddToCart}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-9 w-9 sm:h-9 sm:w-9 rounded-full shadow-md bg-primary hover:bg-primary/90 z-10"
            aria-label={`Agregar ${name} al carrito`}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </>
  );
};
