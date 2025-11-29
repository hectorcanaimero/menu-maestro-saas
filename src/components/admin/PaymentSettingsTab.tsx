import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PaymentMethodsManager } from "./PaymentMethodsManager";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const paymentSettingsSchema = z.object({
  currency: z.string().min(1, "Selecciona una moneda"),
  decimal_places: z.number().min(0).max(4),
  decimal_separator: z.string().max(5, "Máximo 5 caracteres"),
  thousands_separator: z.string().max(5, "Máximo 5 caracteres"),
  accept_cash: z.boolean(),
  require_payment_proof: z.boolean(),
});

type PaymentSettingsForm = z.infer<typeof paymentSettingsSchema>;

interface PaymentSettingsTabProps {
  storeId: string;
  initialData: {
    currency: string | null;
    decimal_places: number | null;
    decimal_separator: string | null;
    thousands_separator: string | null;
    accept_cash: boolean | null;
    require_payment_proof: boolean | null;
  };
}

const CURRENCIES = [
  { value: "USD", label: "Dólar Estadounidense (USD)" },
  { value: "VES", label: "Bolívar Venezolano (VES)" },
  { value: "BRL", label: "Real Brasileño (BRL)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "COP", label: "Peso Colombiano (COP)" },
  { value: "ARS", label: "Peso Argentino (ARS)" },
  { value: "MXN", label: "Peso Mexicano (MXN)" },
];

export function PaymentSettingsTab({ storeId, initialData }: PaymentSettingsTabProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentSettingsForm>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      currency: initialData.currency || "USD",
      decimal_places: initialData.decimal_places || 2,
      decimal_separator: initialData.decimal_separator || ",",
      thousands_separator: initialData.thousands_separator || ".",
      accept_cash: initialData.accept_cash ?? true,
      require_payment_proof: initialData.require_payment_proof ?? false,
    },
  });

  const currency = watch("currency");
  const acceptCash = watch("accept_cash");
  const requirePaymentProof = watch("require_payment_proof");

  useEffect(() => {
    setValue("currency", initialData.currency || "USD");
    setValue("decimal_places", initialData.decimal_places || 2);
    setValue("decimal_separator", initialData.decimal_separator || ",");
    setValue("thousands_separator", initialData.thousands_separator || ".");
    setValue("accept_cash", initialData.accept_cash ?? true);
    setValue("require_payment_proof", initialData.require_payment_proof ?? false);
  }, [initialData, setValue]);

  const onSubmit = async (data: PaymentSettingsForm) => {
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          currency: data.currency,
          decimal_places: data.decimal_places,
          decimal_separator: data.decimal_separator,
          thousands_separator: data.thousands_separator,
          accept_cash: data.accept_cash,
          require_payment_proof: data.require_payment_proof,
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeId);

      if (error) throw error;

      toast.success("Configuración de pagos guardada correctamente");
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error saving payment settings:", error);
      toast.error("Error al guardar la configuración");
    }
  };

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-xl md:text-2xl">Configuración de pagos</CardTitle>
        <CardDescription className="text-sm">
          En esta sección puede configurar los métodos de pago y otros ajustes.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm md:text-base">Moneda</Label>
            <Select value={currency} onValueChange={(value) => setValue("currency", value)}>
              <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className="text-xs md:text-sm text-destructive">{errors.currency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimal_places" className="text-sm md:text-base">Número de decimales</Label>
            <Input
              id="decimal_places"
              type="number"
              min="0"
              max="4"
              {...register("decimal_places", { valueAsNumber: true })}
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              Esto establece el número de puntos decimales que se muestran en el precio mostrado.
            </p>
            {errors.decimal_places && (
              <p className="text-xs md:text-sm text-destructive">{errors.decimal_places.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimal_separator" className="text-sm md:text-base">Separador decimal</Label>
            <Input
              id="decimal_separator"
              {...register("decimal_separator")}
              placeholder=","
              maxLength={5}
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              Esto establece el separador decimal de los precios mostrados.
            </p>
            {errors.decimal_separator && (
              <p className="text-xs md:text-sm text-destructive">{errors.decimal_separator.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thousands_separator" className="text-sm md:text-base">Separador de miles</Label>
            <Input
              id="thousands_separator"
              {...register("thousands_separator")}
              placeholder="."
              maxLength={5}
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              Esto establece el separador de miles de los precios mostrados.
            </p>
            {errors.thousands_separator && (
              <p className="text-xs md:text-sm text-destructive">{errors.thousands_separator.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accept_cash" className="text-sm md:text-base">¿Aceptar pago en efectivo?</Label>
            <Select
              value={acceptCash ? "yes" : "no"}
              onValueChange={(value) => setValue("accept_cash", value === "yes")}
            >
              <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4 md:my-6" />

          <PaymentMethodsManager storeId={storeId} />

          <Separator className="my-4 md:my-6" />

          <div className="space-y-2">
            <div className="flex items-center space-x-3 py-1">
              <Checkbox
                id="require_payment_proof"
                checked={requirePaymentProof}
                onCheckedChange={(checked) => setValue("require_payment_proof", checked as boolean)}
                className="h-5 w-5 md:h-4 md:w-4"
              />
              <label
                htmlFor="require_payment_proof"
                className="text-sm md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Requerir comprobante de pago obligatorio en el checkout
              </label>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Si está activado, el cliente deberá subir obligatoriamente un comprobante de pago al
              hacer el pedido. Si está desactivado, el campo de comprobante estará oculto.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm">
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
