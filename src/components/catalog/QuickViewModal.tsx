import { useEffect, useState } from "react";
import { useQuickView } from "@/hooks/useQuickView";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, ShoppingCart, Eye, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { ProductExtrasDialog } from "./ProductExtrasDialog";
import { useProductPromotions, getBestPromotion } from "@/hooks/usePromotions";
import { H3, Body } from "@/components/ui/typography";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getCurrencySymbol } from "@/lib/analytics";

export function QuickViewModal() {
  const { isOpen, currentProduct, closeQuickView, nextProduct, previousProduct, currentIndex, allProducts } = useQuickView();
  const { addItem } = useCart();
  const { store } = useStore();
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Get currency symbol from store
  const currencySymbol = getCurrencySymbol((store as any)?.currency || 'USD');

  // Get applicable promotions for current product
  const productPromotions = useProductPromotions(
    currentProduct?.id || "",
    currentProduct?.categoryId || null
  );
  const bestDeal = getBestPromotion(productPromotions, currentProduct?.price || 0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          closeQuickView();
          break;
        case "ArrowLeft":
          e.preventDefault();
          previousProduct();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextProduct();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeQuickView, nextProduct, previousProduct]);

  // Touch gesture handling for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextProduct();
    }
    if (isRightSwipe) {
      previousProduct();
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleAddToCart = () => {
    setShowExtrasDialog(true);
  };

  const handleConfirmWithExtras = (extras: any[]) => {
    if (!currentProduct) return;
    addItem({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      image_url: currentProduct.image_url,
      extras,
      categoryId: currentProduct.categoryId,
    });
    setShowExtrasDialog(false);
  };

  if (!currentProduct) return null;

  const hasDiscount = !!bestDeal;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allProducts.length - 1;

  const content = (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button (mobile only - desktop has default X) */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={closeQuickView}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Navigation arrows (desktop) */}
      {!isMobile && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm disabled:opacity-30"
            onClick={previousProduct}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm disabled:opacity-30"
            onClick={nextProduct}
            disabled={!hasNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      <div className={`${isMobile ? "flex flex-col" : "grid grid-cols-2 gap-6"}`}>
        {/* Product Image */}
        <div className={`${isMobile ? "w-full aspect-square" : "aspect-square"} overflow-hidden bg-muted/30 rounded-lg relative`}>
          {currentProduct.image_url ? (
            <img
              src={currentProduct.image_url}
              alt={currentProduct.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <Eye className="w-20 h-20 text-muted-foreground/30" />
            </div>
          )}

          {/* Sale Badge */}
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground shadow-md flex items-center gap-1.5 text-sm px-3 py-1">
              <Tag className="w-4 h-4" />
              {bestDeal.promotion.type === 'percentage'
                ? `-${bestDeal.promotion.value}%`
                : `-${currencySymbol}${bestDeal.promotion.value.toFixed(2)}`
              }
            </Badge>
          )}

          {/* Progress indicator for mobile swipe */}
          {isMobile && allProducts.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {allProducts.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className={`flex flex-col ${isMobile ? "p-6 pt-4" : ""}`}>
          <div className="flex-1">
            <H3 className="mb-2">{currentProduct.name}</H3>

            {/* Price Display with Discount */}
            <div className="mb-4">
              {hasDiscount ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p
                      className="text-3xl font-bold"
                      style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
                    >
                      {currencySymbol}{bestDeal.discountedPrice.toFixed(2)}
                    </p>
                    <p className="text-lg text-muted-foreground line-through">
                      {currencySymbol}{currentProduct.price.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Ahorra {currencySymbol}{bestDeal.savings.toFixed(2)}
                  </Badge>
                </div>
              ) : (
                <p
                  className="text-3xl font-bold"
                  style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
                >
                  {currencySymbol}{currentProduct.price.toFixed(2)}
                </p>
              )}
            </div>

            {currentProduct.description && (
              <Body className="text-muted-foreground mb-6 leading-relaxed">
                {currentProduct.description}
              </Body>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className="w-full mt-4"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Agregar al Carrito
          </Button>

          {/* Mobile navigation indicators */}
          {isMobile && allProducts.length > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Desliza para ver más productos</span>
              <span>{currentIndex + 1} / {allProducts.length}</span>
            </div>
          )}

          {/* Desktop page indicator */}
          {!isMobile && allProducts.length > 1 && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              {currentIndex + 1} de {allProducts.length}
            </div>
          )}
        </div>
      </div>

      {/* Extras Dialog */}
      {currentProduct && (
        <ProductExtrasDialog
          open={showExtrasDialog}
          onOpenChange={setShowExtrasDialog}
          productId={currentProduct.id}
          productName={currentProduct.name}
          productPrice={currentProduct.price}
          onConfirm={handleConfirmWithExtras}
        />
      )}
    </div>
  );

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeQuickView()}>
        <SheetContent
          side="bottom"
          className="h-[95vh] p-0 rounded-t-2xl overflow-y-auto"
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeQuickView()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        {content}
      </DialogContent>
    </Dialog>
  );
}
