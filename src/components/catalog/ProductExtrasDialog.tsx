import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (open) {
      loadExtras();
      // Reset selections when opening
      setSelectedExtras(new Set());
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

  const Content = () => (
    <>
      {loading ? (
        <div className="flex justify-center py-12 md:py-8">
          <Loader2 className="h-10 w-10 md:h-8 md:w-8 animate-spin text-primary" />
        </div>
      ) : extras.length === 0 ? (
        <div className="py-12 md:py-8 text-center text-muted-foreground text-base md:text-sm">
          Este producto no tiene extras disponibles
        </div>
      ) : (
        <div className="space-y-4 md:space-y-3">
          <p className="text-base md:text-sm text-muted-foreground px-4 md:px-0">
            Selecciona los extras que deseas agregar:
          </p>
          <div className="space-y-2 md:space-y-3 px-4 md:px-0">
            {extras.map((extra) => (
              <div
                key={extra.id}
                className="flex items-center gap-3 p-4 md:p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer min-h-[60px] md:min-h-0"
                onClick={() => toggleExtra(extra.id)}
              >
                <Checkbox
                  id={extra.id}
                  checked={selectedExtras.has(extra.id)}
                  onCheckedChange={() => toggleExtra(extra.id)}
                  className="h-5 w-5 md:h-4 md:w-4"
                />
                <Label
                  htmlFor={extra.id}
                  className="flex-1 cursor-pointer flex justify-between items-center gap-3"
                >
                  <span className="text-base md:text-sm font-medium">{extra.name}</span>
                  <span className="text-base md:text-sm font-semibold whitespace-nowrap" style={{ color: `hsl(var(--price-color, var(--foreground)))` }}>
                    +${extra.price.toFixed(2)}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const Footer = () => (
    <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0 mt-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-2">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl md:text-lg font-bold" style={{ color: `hsl(var(--price-color, var(--foreground)))` }}>
            ${calculateTotal().toFixed(2)}
          </p>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm font-medium"
        >
          Agregar al carrito
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="text-lg text-left">Personalizar: {productName}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <Content />
          </div>

          <Footer />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalizar: {productName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <Content />
        </div>

        <Footer />
      </DialogContent>
    </Dialog>
  );
};
