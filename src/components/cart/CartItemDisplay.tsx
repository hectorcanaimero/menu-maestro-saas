import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useProductPromotions, getBestPromotion } from "@/hooks/usePromotions";
import { H4, Body, Caption } from "@/components/ui/typography";
import { useFormatPrice } from "@/lib/priceFormatter";

interface CartItemExtra {
  id: string;
  name: string;
  price: number;
}

interface CartItemDisplayProps {
  cartItemId: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  extras?: CartItemExtra[];
  categoryId?: string | null;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

export function CartItemDisplay({
  cartItemId,
  id,
  name,
  price,
  quantity,
  image_url,
  extras,
  categoryId,
  onUpdateQuantity,
  onRemove,
}: CartItemDisplayProps) {
  // Get applicable promotions for this product
  const productPromotions = useProductPromotions(id, categoryId);
  const bestDeal = getBestPromotion(productPromotions, price);
  const formatPrice = useFormatPrice();

  const extrasTotal = extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;

  // Calculate base price (product + extras)
  const basePrice = price + extrasTotal;

  // Apply discount to base price if available
  const discountedBasePrice = bestDeal ? bestDeal.discountedPrice + extrasTotal : basePrice;
  const itemTotal = discountedBasePrice * quantity;
  const savings = bestDeal ? bestDeal.savings * quantity : 0;

  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card">
      {image_url ? (
        <img
          src={image_url}
          alt={name}
          loading="lazy"
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <H4 className="text-sm sm:text-base">{name}</H4>

        {/* Extras display */}
        {extras && extras.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {extras.map((extra) => (
              <Caption key={extra.id}>
                + {extra.name}{" "}
                <span className="font-medium">({formatPrice(extra.price)})</span>
              </Caption>
            ))}
          </div>
        )}

        {/* Promotion badge */}
        {bestDeal && (
          <Badge variant="destructive" className="mt-1 text-xs">
            {bestDeal.promotion.type === 'percentage'
              ? `-${bestDeal.promotion.value}%`
              : `-${formatPrice(bestDeal.promotion.value)}`}
          </Badge>
        )}

        {/* Price display */}
        <div className="mt-1 sm:mt-2">
          {bestDeal ? (
            <div className="space-y-0.5">
              <p
                className="text-xs sm:text-sm font-semibold"
                style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
              >
                {formatPrice(itemTotal)}
                {quantity > 1 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({formatPrice(discountedBasePrice)} c/u)
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(basePrice * quantity)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Ahorras {formatPrice(savings)}
                </Badge>
              </div>
            </div>
          ) : (
            <p
              className="text-xs sm:text-sm font-semibold"
              style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
            >
              {formatPrice(itemTotal)}
              {quantity > 1 && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({formatPrice(basePrice)} c/u)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2 sm:mt-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(cartItemId, quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-medium text-sm">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(cartItemId, quantity + 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => onRemove(cartItemId)}
            aria-label="Eliminar item"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
