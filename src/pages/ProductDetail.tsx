import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import posthog from 'posthog-js';
import { Header } from '@/components/catalog/Header';
import { Footer } from '@/components/catalog/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Tag, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { useProductPromotions, getBestPromotion } from '@/hooks/usePromotions';
import { useStore } from '@/contexts/StoreContext';
import { useFormatPrice } from '@/lib/priceFormatter';
import { DualPrice } from '@/components/catalog/DualPrice';
import { useProductExtraGroups } from '@/hooks/useExtraGroups';
import { validateStock } from '@/lib/stockValidator';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[] | null;
  category_id: string | null;
  categories?: { name: string } | null;
  is_available: boolean | null;
  stock_quantity: number | null;
  stock_minimum: number;
  track_stock: boolean;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { store } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const formatPrice = useFormatPrice();

  // Check if gallery is enabled (non-food store with multiple images)
  const isGalleryEnabled = store?.is_food_business === false;
  const allImages = product ? [
    product.image_url,
    ...(isGalleryEnabled && product.images ? product.images : [])
  ].filter(Boolean) as string[] : [];

  // Check if product is out of stock (only for non-food stores with stock tracking)
  const isOutOfStock = product?.track_stock && product?.stock_quantity !== null && product?.stock_quantity !== undefined && product?.stock_quantity <= 0;

  // Product is effectively unavailable if marked unavailable OR out of stock
  const effectivelyUnavailable = !product?.is_available || isOutOfStock;

  // Get grouped extras for this product
  const { data: groupedExtras, isLoading: extrasLoading } = useProductExtraGroups(id || '');

  // Apply store theme colors
  useStoreTheme();

  // Get promotions for this product
  const productPromotions = useProductPromotions(id || '', product?.category_id);
  const bestDeal = product ? getBestPromotion(productPromotions, product.price) : null;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);

      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('menu_items')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (productError || !productData) {
        toast.error('Producto no encontrado');
        navigate('/');
        return;
      }

      setProduct(productData);
      setLoading(false);

      // Track product_viewed event in PostHog
      try {
        if (store?.id && productData) {
          posthog.capture('product_viewed', {
            store_id: store.id,
            store_name: store.name,
            product_id: productData.id,
            product_name: productData.name,
            price: productData.price,
            category_id: productData.category_id,
            is_available: productData.is_available,
            has_image: !!productData.image_url,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('[PostHog] Error tracking product_viewed:', error);
      }
    };

    fetchProduct();
  }, [id, navigate, store]);

  const toggleExtra = (groupId: string, extraId: string, isSingle: boolean) => {
    setSelectedExtras((prev) => {
      const newMap = new Map(prev);
      const groupSelections = newMap.get(groupId) || new Set();

      if (isSingle) {
        // For single selection groups, replace the selection
        newMap.set(groupId, new Set([extraId]));
      } else {
        // For multiple selection groups, toggle the extra
        if (groupSelections.has(extraId)) {
          groupSelections.delete(extraId);
        } else {
          groupSelections.add(extraId);
        }
        newMap.set(groupId, groupSelections);
      }

      return newMap;
    });
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const basePrice = bestDeal ? bestDeal.discountedPrice : product.price;

    let extrasTotal = 0;
    if (groupedExtras) {
      groupedExtras.forEach((groupedExtra) => {
        const selections = selectedExtras.get(groupedExtra.group.id);
        if (selections) {
          groupedExtra.extras.forEach((extra) => {
            if (selections.has(extra.id)) {
              extrasTotal += extra.price;
            }
          });
        }
      });
    }

    return basePrice + extrasTotal;
  };

  const validateSelections = (): boolean => {
    if (!groupedExtras) return true;

    for (const groupedExtra of groupedExtras) {
      const { group } = groupedExtra;
      const selections = selectedExtras.get(group.id);
      const selectionCount = selections?.size || 0;

      if (group.is_required && selectionCount === 0) {
        toast.error(`Debes seleccionar al menos una opción en "${group.name}"`);
        return false;
      }

      if (group.min_selections && selectionCount < group.min_selections) {
        toast.error(`Debes seleccionar al menos ${group.min_selections} opciones en "${group.name}"`);
        return false;
      }

      if (group.max_selections && selectionCount > group.max_selections) {
        toast.error(`Puedes seleccionar máximo ${group.max_selections} opciones en "${group.name}"`);
        return false;
      }
    }

    return true;
  };

  const handleAddToCart = async () => {
    if (!product || !validateSelections()) return;

    // Validate stock before adding to cart
    const stockValidation = await validateStock(product.id, 1);

    if (!stockValidation.isValid) {
      toast.error(stockValidation.message || 'Producto no disponible');
      return;
    }

    // Flatten selected extras from all groups
    const selectedExtrasArray: Array<{ id: string; name: string; price: number }> = [];

    if (groupedExtras) {
      groupedExtras.forEach((groupedExtra) => {
        const selections = selectedExtras.get(groupedExtra.group.id);
        if (selections) {
          groupedExtra.extras.forEach((extra) => {
            if (selections.has(extra.id)) {
              selectedExtrasArray.push({
                id: extra.id,
                name: extra.name,
                price: extra.price,
              });
            }
          });
        }
      });
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      extras: selectedExtrasArray,
      categoryId: product.category_id,
    });

    // Navigate back to store after adding to cart
    // Use setTimeout to ensure the cart state updates and toast shows before navigation
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  const handleWhatsAppInquiry = () => {
    if (!product || !store?.phone) return;

    // WhatsApp phone number (remove + and spaces)
    const whatsappNumber = store.phone.replace(/\+/g, '').replace(/\s/g, '');

    // Create detailed message with product information
    const productPrice = formatPrice(bestDeal ? bestDeal.discountedPrice : product.price);
    let messageText = `Hola *${store.name || 'Tienda'}*, estoy interesado en:\n\n`;
    messageText += `📦 *${product.name}*\n`;
    messageText += `💰 Precio: ${productPrice.original}`;

    // Add promotion info if available
    if (bestDeal) {
      const savings = formatPrice(bestDeal.savings);
      messageText += ` ~~${formatPrice(product.price).original}~~\n`;
      messageText += `🎉 ¡Ahorro de ${savings.original}!`;
    }

    messageText += `\n\n¿Podrían darme más información sobre este producto?`;

    const message = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-muted">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Product Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className={`aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 relative ${effectivelyUnavailable ? 'opacity-70' : ''}`}>
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImageIndex]}
                  alt={product.name}
                  className={`w-full h-full object-cover ${effectivelyUnavailable ? 'grayscale' : ''}`}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-muted ${effectivelyUnavailable ? 'grayscale' : ''}`}>
                  <span className="text-muted-foreground">Sin imagen</span>
                </div>
              )}
              {effectivelyUnavailable && (
                <Badge className="absolute top-3 right-3 bg-gray-600 text-white shadow-md">
                  {isOutOfStock ? 'Agotado' : 'No disponible'}
                </Badge>
              )}
              {bestDeal && !effectivelyUnavailable && (
                <Badge variant="destructive" className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1">
                  <Tag className="w-3 h-3" />
                  {bestDeal.promotion.type === 'percentage'
                    ? `-${bestDeal.promotion.value}%`
                    : `-${formatPrice(bestDeal.savings).original}`}
                </Badge>
              )}
            </div>

            {/* Thumbnail Gallery - Only show if multiple images */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} - imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{product.name}</h1>
              {product.categories?.name && (
                <Badge variant="secondary" className="mb-3">
                  {product.categories.name}
                </Badge>
              )}
              <div className="flex items-center gap-3">
                {bestDeal ? (
                  <>
                    <div className="text-2xl text-muted-foreground line-through">
                      <DualPrice price={product.price} size="md" />
                    </div>
                    <div className="text-3xl font-bold" style={{ color: `hsl(var(--price-color, var(--primary)))` }}>
                      <DualPrice price={calculateTotalPrice()} size="lg" />
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold" style={{ color: `hsl(var(--price-color, var(--primary)))` }}>
                    <DualPrice price={calculateTotalPrice()} size="lg" />
                  </div>
                )}
              </div>
              {bestDeal && (
                <Badge variant="outline" className="mt-2 flex items-center gap-3">
                  Ahorra <DualPrice price={bestDeal.savings} size="sm" />
                </Badge>
              )}
            </div>

            {product.description && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Extras Groups Section */}
            {!extrasLoading && groupedExtras && groupedExtras.length > 0 && (
              <div className="space-y-6 border-t border-border pt-4">
                <h2 className="text-lg font-semibold text-foreground">Personaliza tu pedido</h2>
                {groupedExtras.map((groupedExtra) => {
                  const { group, extras } = groupedExtra;
                  const isSingle = group.selection_type === 'single';
                  const groupSelections = selectedExtras.get(group.id);

                  return (
                    <div key={group.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{group.name}</h3>
                        {group.is_required && <span className="text-destructive">*</span>}
                      </div>

                      {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}

                      {isSingle ? (
                        <RadioGroup
                          value={groupSelections?.values().next().value || ''}
                          onValueChange={(value) => toggleExtra(group.id, value, true)}
                        >
                          <div className="space-y-2">
                            {extras.map((extra) => (
                              <label
                                key={extra.id}
                                className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem value={extra.id} id={extra.id} className="mt-0.5" />
                                  <div>
                                    <span className="text-foreground font-medium">{extra.name}</span>
                                    {extra.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{extra.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="text-sm font-semibold flex-shrink-0 ml-2"
                                  style={{ color: `hsl(var(--price-color, var(--primary)))` }}
                                >
                                  {extra.price > 0 && '+'}
                                  <DualPrice price={extra.price} size="sm" />
                                </div>
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                      ) : (
                        <div className="space-y-2">
                          {extras.map((extra) => (
                            <label
                              key={extra.id}
                              className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={groupSelections?.has(extra.id) || false}
                                  onCheckedChange={() => toggleExtra(group.id, extra.id, false)}
                                  className="mt-0.5"
                                />
                                <div>
                                  <span className="text-foreground font-medium">{extra.name}</span>
                                  {extra.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{extra.description}</p>
                                  )}
                                </div>
                              </div>
                              <div
                                className="text-sm font-semibold flex-shrink-0 ml-2"
                                style={{ color: `hsl(var(--price-color, var(--primary)))` }}
                              >
                                {extra.price > 0 && '+'}
                                <DualPrice price={extra.price} size="sm" />
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {(group.min_selections || group.max_selections) && (
                        <p className="text-xs text-muted-foreground">
                          {group.min_selections && group.max_selections
                            ? `Selecciona entre ${group.min_selections} y ${group.max_selections} opciones`
                            : group.min_selections
                            ? `Selecciona al menos ${group.min_selections} ${
                                group.min_selections === 1 ? 'opción' : 'opciones'
                              }`
                            : `Selecciona máximo ${group.max_selections} ${
                                group.max_selections === 1 ? 'opción' : 'opciones'
                              }`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {effectivelyUnavailable && (
              <div className="pt-4">
                <p className="text-sm text-destructive text-center">
                  {isOutOfStock ? 'Este producto está agotado' : 'Este producto no está disponible actualmente'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Cart or WhatsApp depending on catalog mode */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border p-4 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          {store?.catalog_mode ? (
            // WhatsApp button for catalog mode (PIDEA-79)
            <Button
              onClick={handleWhatsAppInquiry}
              disabled={!store?.phone}
              className="w-full h-14 text-lg font-semibold shadow-lg"
              style={{
                backgroundColor: store?.primary_color || '#25D366', // WhatsApp green default
              }}
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              {store?.phone ? 'Consultar por WhatsApp' : 'WhatsApp no configurado'}
            </Button>
          ) : (
            // Add to cart button for normal mode
            <Button
              onClick={handleAddToCart}
              disabled={effectivelyUnavailable}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              {effectivelyUnavailable ? (isOutOfStock ? 'Agotado' : 'No disponible') : 'Agregar al carrito'}
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
