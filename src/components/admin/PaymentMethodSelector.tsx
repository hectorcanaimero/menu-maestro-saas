import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onMethodChange: (method: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  required = false,
  disabled = false,
}: PaymentMethodSelectorProps) => {
  const { store } = useStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, [store?.id]);

  const loadPaymentMethods = async () => {
    if (!store?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name, description")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setPaymentMethods(data || []);

      // Auto-select if only one method
      if (data && data.length === 1 && !selectedMethod) {
        onMethodChange(data[0].name);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay métodos de pago configurados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        Método de Pago {required && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
      </Label>

      <div className="space-y-2">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`p-4 transition-all ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              selectedMethod === method.name
                ? "border-primary bg-primary/5"
                : disabled
                  ? ""
                  : "hover:border-border hover:bg-accent/50"
            }`}
            onClick={() => !disabled && onMethodChange(method.name)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedMethod === method.name
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                }`}
              >
                {selectedMethod === method.name && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{method.name}</div>
                {method.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {method.description}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
