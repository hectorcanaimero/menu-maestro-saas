import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProductExtrasDialog } from "./ProductExtrasDialog";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description?: string | null;
  layout?: "grid" | "list";
  compact?: boolean;
}

export const ProductCard = ({
  id,
  name,
  price,
  image_url,
  description,
  layout = "list",
  compact = false,
}: ProductCardProps) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExtrasDialog(true);
  };

  const handleConfirmWithExtras = (extras: any[]) => {
    addItem({ id, name, price, image_url, extras });
  };

  const isGridView = layout === "grid";

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
        className={`group h-full overflow-hidden border border-border/40 hover:border-border hover:shadow-lg transition-all duration-300 bg-card cursor-pointer rounded-sm relative ${compact ? "max-w-[200px]" : ""}`}
        onClick={() => navigate(`/products/${id}`)}
      >
      <div className={isGridView ? "flex flex-col h-full" : "flex flex-col sm:flex-row h-full"}>
        {/* Image Container */}
        <div
          className={
            isGridView
              ? "w-full aspect-square overflow-hidden bg-muted/30"
              : compact
                ? "w-full aspect-[3/2] overflow-hidden bg-muted/30"
                : "w-full sm:w-48 aspect-square sm:aspect-auto overflow-hidden bg-muted/30 flex-shrink-0"
          }
        >
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <Eye className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-col flex-1 p-4">
          {/* Product Info */}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground text-base line-clamp-1">{name}</h3>
            {description && !compact && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
            <p className="text-lg font-bold pt-1" style={{ color: `hsl(var(--price-color, var(--foreground)))` }}>${price.toFixed(2)}</p>
          </div>
        </div>

        {/* Floating Add Button */}
        <Button
          size="icon"
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90 z-10"
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </div>
      </Card>
    </>
  );
};
