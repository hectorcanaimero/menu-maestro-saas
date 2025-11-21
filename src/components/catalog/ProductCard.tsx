import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description?: string | null;
}

export const ProductCard = ({ id, name, price, image_url, description }: ProductCardProps) => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    addItem({ id, name, price, image_url });
  };

  return (
    <Card className="group h-full overflow-hidden border border-border/40 hover:border-border hover:shadow-lg transition-all duration-300 bg-background">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="aspect-square overflow-hidden bg-muted/30">
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

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground text-base line-clamp-2 min-h-[3rem]">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <p className="text-xl font-bold text-primary">
            ${price.toFixed(2)}
          </p>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/products/${id}`)}
          className="flex-1 border-border/50 hover:border-primary hover:bg-primary/5"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver más
        </Button>
        <Button
          onClick={handleAddToCart}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </CardFooter>
    </Card>
  );
};
