import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/catalog/Header';
import { Footer } from '@/components/catalog/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Tag } from 'lucide-react';
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean | null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { store } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const formatPrice = useFormatPrice();

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
        .select('*')
        .eq('id', id)
        .single();

      if (productError || !productData) {
        toast.error('Producto no encontrado');
        navigate('/');
        return;
      }

      setProduct(productData);
      setLoading(false);
    };

    fetchProduct();
  }, [id, navigate]);

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

  const handleAddToCart = () => {
    if (!product || !validateSelections()) return;

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

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 hover:bg-muted">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Product Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image Gallery - For now single image, can be enhanced later */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">Sin imagen</span>
                </div>
              )}
              {bestDeal && (
                <Badge variant="destructive" className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1">
                  <Tag className="w-3 h-3" />
                  {bestDeal.promotion.type === 'percentage'
                    ? `-${bestDeal.promotion.value}%`
                    : `-${formatPrice(bestDeal.savings).original}`}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{product.name}</h1>
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
                <Badge variant="secondary" className="mt-2 flex items-center gap-1">
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

                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}

                      {isSingle ? (
                        <RadioGroup
                          value={groupSelections?.values().next().value || ''}
                          onValueChange={(value) => toggleExtra(group.id, value, true)}
                        >
                          <div className="space-y-2">
                            {extras.map((extra) => (
                              <label
                                key={extra.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value={extra.id} id={extra.id} />
                                  <span className="text-foreground font-medium">{extra.name}</span>
                                </div>
                                <div
                                  className="text-sm font-semibold"
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
                              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={groupSelections?.has(extra.id) || false}
                                  onCheckedChange={() => toggleExtra(group.id, extra.id, false)}
                                />
                                <span className="text-foreground font-medium">{extra.name}</span>
                              </div>
                              <div
                                className="text-sm font-semibold"
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
                            ? `Selecciona al menos ${group.min_selections} ${group.min_selections === 1 ? 'opción' : 'opciones'}`
                            : `Selecciona máximo ${group.max_selections} ${group.max_selections === 1 ? 'opción' : 'opciones'}`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-3 pt-4">
              {!store?.catalog_mode ? (
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.is_available}
                  className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.is_available ? 'Agregar al carrito' : 'No disponible'}
                </Button>
              ) : null}

              {!product.is_available && (
                <p className="text-sm text-destructive text-center">Este producto no está disponible actualmente</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
