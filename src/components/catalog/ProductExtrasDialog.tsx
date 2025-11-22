import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProductExtra {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

interface SelectedExtra {
  id: string;
  name: string;
  price: number;
}

interface ProductExtrasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productPrice: number;
  onConfirm: (extras: SelectedExtra[]) => void;
}

export const ProductExtrasDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  productPrice,
  onConfirm,
}: ProductExtrasDialogProps) => {
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadExtras();
    }
  }, [open, productId]);

  const loadExtras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_extras")
        .select("*")
        .eq("menu_item_id", productId)
        .eq("is_available", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setExtras(data || []);
    } catch (error) {
      console.error("Error loading extras:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(extraId)) {
        newSet.delete(extraId);
      } else {
        newSet.add(extraId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selected = extras
      .filter((extra) => selectedExtras.has(extra.id))
      .map((extra) => ({
        id: extra.id,
        name: extra.name,
        price: extra.price,
      }));
    
    onConfirm(selected);
    setSelectedExtras(new Set());
    onOpenChange(false);
  };

  const calculateTotal = () => {
    const extrasTotal = extras
      .filter((extra) => selectedExtras.has(extra.id))
      .reduce((sum, extra) => sum + extra.price, 0);
    return productPrice + extrasTotal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar: {productName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : extras.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Este producto no tiene extras disponibles
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona los extras que deseas agregar:
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {extras.map((extra) => (
                <div key={extra.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <Checkbox
                    id={extra.id}
                    checked={selectedExtras.has(extra.id)}
                    onCheckedChange={() => toggleExtra(extra.id)}
                  />
                  <Label
                    htmlFor={extra.id}
                    className="flex-1 cursor-pointer flex justify-between items-center"
                  >
                    <span>{extra.name}</span>
                    <span className="text-sm font-semibold">
                      +${extra.price.toFixed(2)}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-left">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-bold">${calculateTotal().toFixed(2)}</p>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
