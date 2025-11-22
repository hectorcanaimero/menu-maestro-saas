import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/catalog/Header";
import { Footer } from "@/components/catalog/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/catalog/ProductCard";
import { toast } from "sonner";
import { useStoreTheme } from "@/hooks/useStoreTheme";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  // Apply store theme colors
  useStoreTheme();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);
      
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .single();

      if (productError || !productData) {
        toast.error("Producto no encontrado");
        navigate("/");
        return;
      }

      setProduct(productData);

      // Fetch related products from same category
      if (productData.category_id) {
        const { data: relatedData } = await supabase
          .from("menu_items")
          .select("*")
          .eq("category_id", productData.category_id)
          .eq("is_available", true)
          .neq("id", id)
          .limit(4);

        if (relatedData) {
          setRelatedProducts(relatedData);
        }
      }

      setLoading(false);
    };

    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        });
      }
    }
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
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Product Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image Gallery - For now single image, can be enhanced later */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-3xl font-bold" style={{ color: `hsl(var(--price-color, var(--primary)))` }}>
                ${product.price.toFixed(2)}
              </p>
            </div>

            {product.description && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Descripción
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10"
                >
                  -
                </Button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={!product.is_available}
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.is_available ? "Agregar al carrito" : "No disponible"}
              </Button>
              
              {!product.is_available && (
                <p className="text-sm text-destructive text-center">
                  Este producto no está disponible actualmente
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-border pt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Productos Relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={relatedProduct.price}
                  image_url={relatedProduct.image_url}
                  description={relatedProduct.description}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
